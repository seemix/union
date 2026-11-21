import { serializeJsonLd, type JsonLd as JsonLdData } from '@/lib/seo/json-ld';

/** Inline structured data. Not executed, so the CSP (script-src) does not apply to it. */
export function JsonLd({ data }: { readonly data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
