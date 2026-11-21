import { notFound } from 'next/navigation';
import { getSite, isSiteId } from '@/config/sites';

// Placeholder home page (stage 2 replaces it).
export default async function HomePage({ params }: PageProps<'/[site]'>) {
  const { site } = await params;
  if (!isSiteId(site)) notFound();
  const config = getSite(site);

  return (
    <main>
      <h1>{config.siteTitle}</h1>
      <p>
        site: <code>{config.id}</code> · {config.domain}
      </p>
    </main>
  );
}
