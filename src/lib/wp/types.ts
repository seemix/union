/**
 * WP REST response shapes — only the fields the app reads.
 * Checked against live responses of both installs (baptist.org.md/ru, /ro), 2026-11-21.
 *
 * Notes from the live data:
 * - `views` is a top-level number on every post (WP-PostViews, Q9), on old and new posts alike.
 * - `slug` of ru content is stored percent-encoded lowercase (`%d0%ba…`), see Q4.
 * - Old posts have `featured_media: 0`; some (ro) point to a deleted attachment —
 *   then `_embedded` has no `wp:featuredmedia` at all.
 * - `fimg_url` (string | false | null, from the old theme) is intentionally not typed:
 *   the featured image comes from `_embed=wp:featuredmedia` (ROADMAP stage 2).
 * - Search uses `/wp/v2/posts?search=` (not `/wp/v2/search`), because only posts sorted
 *   by date are wanted (Q17) and `/wp/v2/search` has no `orderby`.
 */

export interface WpRendered {
  readonly rendered: string;
}

/** Error body WP returns for failed requests (and inside `_embedded` for failed embeds). */
export interface WpErrorBody {
  readonly code: string;
  readonly message: string;
  readonly data?: { readonly status?: number } | null;
}

export interface WpMediaSize {
  readonly width: number;
  readonly height: number;
  readonly source_url: string;
  readonly mime_type: string;
}

/**
 * Registered sizes differ per install (e.g. ru `medium` is 350×197, ro 300×169),
 * hence a string record; any size can be missing for small originals.
 */
export type WpMediaSizes = Readonly<Partial<Record<string, WpMediaSize>>>;

export interface WpMedia {
  readonly id: number;
  readonly alt_text: string;
  readonly source_url: string;
  readonly media_details: {
    readonly width?: number;
    readonly height?: number;
    readonly sizes?: WpMediaSizes;
  };
}

/** Embedded term (`_embed=wp:term`). */
export interface WpTerm {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly taxonomy: 'category' | 'post_tag' | (string & {});
}

export interface WpEmbedded {
  /** Missing when the attachment no longer exists; an item may be an error body. */
  readonly 'wp:featuredmedia'?: readonly (WpMedia | WpErrorBody)[];
  /** One array per taxonomy: `[categories, tags]`. */
  readonly 'wp:term'?: readonly (readonly WpTerm[])[];
}

/** Post as shown in cards / lists (home sliders, category, search). */
export interface WpPostSummary {
  readonly id: number;
  /** Site-local time, ISO without zone, e.g. `2026-11-19T11:13:34`. */
  readonly date: string;
  readonly slug: string;
  readonly title: WpRendered;
  readonly excerpt: WpRendered;
  readonly featured_media: number;
  /** WP-PostViews counter (Q9). */
  readonly views: number;
  readonly _embedded?: Pick<WpEmbedded, 'wp:featuredmedia'>;
}

/** Full post (`/post/[idSlug]`). */
export interface WpPost extends Omit<WpPostSummary, '_embedded'> {
  /**
   * Anonymous REST only returns `publish` (drafts/private answer 401, see `getPost`);
   * still checked by the page in case the API ever runs authenticated.
   */
  readonly status: 'publish' | 'future' | 'draft' | 'pending' | 'private' | (string & {});
  /** UTC, ISO without zone. */
  readonly date_gmt: string;
  readonly modified: string;
  /** UTC, ISO without zone. */
  readonly modified_gmt: string;
  readonly content: WpRendered;
  readonly categories: readonly number[];
  readonly _embedded?: WpEmbedded;
}

/** Minimal post for id → slug lookups (old `/post?id=` redirects, canonical checks). */
export interface WpPostIdSlug {
  readonly id: number;
  readonly slug: string;
}

export interface WpPage {
  readonly id: number;
  readonly slug: string;
  readonly modified: string;
  readonly title: WpRendered;
  readonly content: WpRendered;
  readonly excerpt: WpRendered;
}

export interface WpCategory {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly parent: number;
  readonly count: number;
}

/** Search hits are ordinary post summaries (see header note). */
export type WpSearchResult = WpPostSummary;

/** One page of a collection plus WP pagination headers. */
export interface WpList<T> {
  readonly items: readonly T[];
  /** `X-WP-Total`. */
  readonly total: number;
  /** `X-WP-TotalPages` (0 when there are no items). */
  readonly totalPages: number;
}
