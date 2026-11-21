/**
 * Low-level WP REST client. No caching here: cached getters live in `./api.ts`.
 *
 * Two layers:
 * - `wpRequest()` never throws and returns a plain serializable `WpResult`. That is what
 *   `use cache` functions must return: an error thrown inside a cache scope crosses the
 *   RSC serializer and arrives as a generic (in prod: digest-only) Error, losing its class.
 * - `wpFetch()` / `unwrapWp()` turn a result into data, `null` (WP 404 → page calls
 *   `notFound()`), or a thrown `WpError`.
 */
import { getSite, type SiteId } from '@/config/sites';
import type { WpErrorBody } from './types';

export const WP_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 300;

/** Embeddable relations we request. */
export type WpEmbedRel = 'wp:featuredmedia' | 'wp:term';

export type WpParamValue =
  string | number | boolean | readonly (string | number)[] | null | undefined;

export interface WpParams {
  /** Response fields; `_links`/`_embedded` are added automatically when `_embed` is set. */
  readonly _fields?: readonly string[];
  /** `true` = embed everything (avoid), or a list of relations. */
  readonly _embed?: true | readonly WpEmbedRel[];
  readonly [name: string]: WpParamValue;
}

export type WpErrorKind = 'http' | 'timeout' | 'network' | 'parse';

/** Serializable error description (safe to return from `use cache`). */
export interface WpErrorInfo {
  readonly kind: WpErrorKind;
  readonly message: string;
  readonly url: string;
  /** HTTP status, for `kind: 'http'`. */
  readonly status?: number;
  /** WP error code from the JSON body (`rest_no_route`, …), when present. */
  readonly code?: string;
}

export type WpResult<T> =
  | {
      readonly status: 'ok';
      readonly data: T;
      /** `X-WP-Total`, `null` for single resources. */
      readonly total: number | null;
      /** `X-WP-TotalPages`, `null` for single resources. */
      readonly totalPages: number | null;
    }
  | { readonly status: 'not_found' }
  | { readonly status: 'error'; readonly error: WpErrorInfo };

export type WpOk<T> = Extract<WpResult<T>, { status: 'ok' }>;

export class WpError extends Error {
  readonly kind: WpErrorKind;
  readonly url: string;
  readonly status: number | undefined;
  readonly code: string | undefined;

  constructor(info: WpErrorInfo) {
    super(info.message);
    this.name = 'WpError';
    this.kind = info.kind;
    this.url = info.url;
    this.status = info.status;
    this.code = info.code;
  }
}

/**
 * WP answers that mean "this content does not exist" (→ `null`).
 * `rest_no_route` is a 404 too, but means a wrong endpoint/config — it must throw.
 * A page number past the end is a 400 `rest_post_invalid_page_number` (posts, pages).
 */
function isNotFound(status: number, body: WpErrorBody | null): boolean {
  if (status === 404) return body !== null && body.code !== 'rest_no_route';
  if (status === 400) return body?.code === 'rest_post_invalid_page_number';
  return false;
}

function isErrorBody(value: unknown): value is WpErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

function serializeParam(value: Exclude<WpParamValue, null | undefined>): string {
  return Array.isArray(value) ? value.join(',') : String(value);
}

/**
 * Builds the request URL. Supports both REST base forms:
 * `https://host/?rest_route=/wp/v2/` (current WP installs: `/wp-json/` is not routed there)
 * and `https://host/wp-json/wp/v2/`.
 */
export function buildWpUrl(restBase: string, path: string, params: WpParams = {}): string {
  const url = new URL(restBase);
  const cleanPath = path.replace(/^\/+/, '');
  const route = url.searchParams.get('rest_route');
  if (route !== null) {
    url.searchParams.set('rest_route', route.replace(/\/?$/, '/') + cleanPath);
  } else {
    url.pathname = url.pathname.replace(/\/?$/, '/') + cleanPath;
  }

  const { _fields, _embed, ...rest } = params;

  for (const [name, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(name, serializeParam(value));
  }

  if (_embed) {
    url.searchParams.set('_embed', _embed === true ? '1' : _embed.join(','));
  }
  if (_fields && _fields.length > 0) {
    const fields = new Set(_fields);
    if (_embed) {
      // With `_fields`, WP only embeds relations whose links are kept in the response.
      if (_embed === true) fields.add('_links');
      else for (const rel of _embed) fields.add(`_links.${rel}`);
      fields.add('_embedded');
    }
    url.searchParams.set('_fields', [...fields].join(','));
  }

  return url.toString();
}

function readIntHeader(headers: Headers, name: string): number | null {
  const raw = headers.get(name);
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Attempt {
  readonly response?: Response;
  readonly error?: WpErrorInfo;
}

async function attempt(url: string, timeoutMs: number): Promise<Attempt> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { response };
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    return {
      error: {
        kind: timedOut ? 'timeout' : 'network',
        message: timedOut
          ? `WP request timed out after ${timeoutMs} ms`
          : `WP request failed: ${err instanceof Error ? err.message : String(err)}`,
        url,
      },
    };
  }
}

async function readJson(response: Response): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false };
  }
}

export interface WpRequestOptions {
  readonly timeoutMs?: number;
}

/** GET a WP REST resource. Never throws. Retries once on 5xx. */
export async function wpRequest<T>(
  site: SiteId,
  path: string,
  params: WpParams = {},
  { timeoutMs = WP_TIMEOUT_MS }: WpRequestOptions = {},
): Promise<WpResult<T>> {
  const url = buildWpUrl(getSite(site).wp.restBase, path, params);

  let result = await attempt(url, timeoutMs);
  if (result.response && result.response.status >= 500) {
    await result.response.body?.cancel();
    await sleep(RETRY_DELAY_MS);
    result = await attempt(url, timeoutMs);
  }
  if (!result.response) {
    return { status: 'error', error: result.error! };
  }

  const { response } = result;
  const json = await readJson(response);

  if (!response.ok) {
    const body = json.ok && isErrorBody(json.value) ? json.value : null;
    if (isNotFound(response.status, body)) return { status: 'not_found' };
    return {
      status: 'error',
      error: {
        kind: 'http',
        message: `WP responded ${response.status}${body ? ` ${body.code}: ${body.message}` : ''}`,
        url,
        status: response.status,
        ...(body ? { code: body.code } : {}),
      },
    };
  }

  if (!json.ok) {
    return {
      status: 'error',
      error: {
        kind: 'parse',
        message: 'WP response is not valid JSON',
        url,
        status: response.status,
      },
    };
  }

  return {
    status: 'ok',
    data: json.value as T,
    total: readIntHeader(response.headers, 'X-WP-Total'),
    totalPages: readIntHeader(response.headers, 'X-WP-TotalPages'),
  };
}

/** `ok` → the result, `not_found` → `null`, `error` → throws `WpError`. */
export function unwrapWp<T>(result: WpResult<T>): WpOk<T> | null {
  if (result.status === 'ok') return result;
  if (result.status === 'not_found') return null;
  throw new WpError(result.error);
}

/**
 * GET a WP REST resource (uncached). Returns data with pagination totals,
 * `null` when WP says the content does not exist, throws `WpError` otherwise.
 */
export async function wpFetch<T>(
  site: SiteId,
  path: string,
  params: WpParams = {},
  options?: WpRequestOptions,
): Promise<WpOk<T> | null> {
  return unwrapWp(await wpRequest<T>(site, path, params, options));
}
