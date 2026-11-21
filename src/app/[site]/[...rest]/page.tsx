import { notFound } from 'next/navigation';

// Any path without a route renders the 404 inside the site's layout (correct `lang`),
// instead of falling through to Next's global 404 (there is no `app/layout.tsx`).
// Also the target of the proxy's rewrite for external `/ru/…`, `/ro/…` requests.
export default function CatchAllNotFound() {
  notFound();
}
