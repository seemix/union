import { NextResponse } from 'next/server';
import { getRequestSite } from '@/lib/site/server';

/** Browsers and crawlers ask `/favicon.ico` on their own: answer with the site's icon. */
export async function GET(): Promise<NextResponse> {
  const site = await getRequestSite();
  return new NextResponse(null, { status: 307, headers: { location: site.icons.favicon } });
}
