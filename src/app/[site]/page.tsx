import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSite, isSiteId, type HomeSlider as SliderConfig } from '@/config/sites';
import { homeLd } from '@/lib/seo/json-ld';
import { buildMetadata, homeLanguages } from '@/lib/seo/metadata';
import { postHref } from '@/lib/site/href';
import { excerptOf, featuredImage, getPosts, plainText, type WpPostSummary } from '@/lib/wp';
import { JsonLd } from './_components/JsonLd/JsonLd';
import { HomeSliderSection } from './_components/HomeSlider/HomeSliderSection';
import type { Slide } from './_components/HomeSlider/SlideContent';
import { HomeWidgets } from './_components/Widgets/HomeWidgets';
import css from './page.module.css';

const AREA: Readonly<Record<SliderConfig['id'], string>> = {
  news: css.big,
  world: css.small1,
  prayer: css.small2,
};

function toSlide(post: WpPostSummary, excerptLength: number): Slide {
  return {
    id: post.id,
    href: postHref(post),
    title: plainText(post.title.rendered),
    excerpt: excerptOf(post.excerpt.rendered, excerptLength),
    image: featuredImage(post),
  };
}

/** The only page with hreflang (Q7): ru ⇄ ro home pages, each with a self reference. */
export async function generateMetadata({ params }: PageProps<'/[site]'>): Promise<Metadata> {
  const { site: siteId } = await params;
  if (!isSiteId(siteId)) return {};
  const site = getSite(siteId);
  return buildMetadata({
    site,
    title: site.siteTitle,
    absoluteTitle: true,
    path: '/',
    languages: homeLanguages(),
  });
}

export default async function HomePage({ params }: PageProps<'/[site]'>) {
  const { site: siteId } = await params;
  if (!isSiteId(siteId)) notFound();
  const site = getSite(siteId);

  // All slider queries at once; category ids / counts come from the config.
  const lists = await Promise.all(
    site.sliders.map((s) => getPosts(siteId, { categories: s.categoryIds, perPage: s.count })),
  );

  return (
    <div className={`main ${css.main_wrapper}`}>
      <JsonLd data={homeLd(site)} />
      <div className={css.main_container}>
        {site.sliders.map((slider, i) => (
          <div key={slider.id} className={AREA[slider.id]}>
            <HomeSliderSection
              slides={(lists[i]?.items ?? []).map((p) => toSlide(p, slider.excerptLength))}
              variant={slider.variant}
              label={slider.label}
              tone={slider.tone === 'green' ? 'green' : 'red'}
            />
          </div>
        ))}
      </div>
      <HomeWidgets site={siteId} />
    </div>
  );
}
