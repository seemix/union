import Link from 'next/link';
import type { ReactNode } from 'react';
import { FaHandHoldingHeart } from 'react-icons/fa';
import { LiaBibleSolid } from 'react-icons/lia';
import { LuChurch } from 'react-icons/lu';
import { MdOutlineOnlinePrediction } from 'react-icons/md';
import { widgetTarget, type SiteId, type Widget } from '@/config/sites';
import { getReadingForDate } from '@/data/bible';
import { hrefOf, type TargetHrefs } from '@/lib/site/href';
import css from './Widgets.module.css';

function Card({
  widget,
  icon,
  href,
  children,
}: {
  widget: Widget;
  icon: ReactNode;
  /** `undefined` = not a link (Q13a). */
  href?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <span className={`${css.icon} ${css[widget.tone]}`}>{icon}</span>
      <h3>{widget.label}</h3>
    </>
  );
  return (
    <div className={css.widget_card}>
      {href === undefined ? (
        <div className={css.link}>{inner}</div>
      ) : (
        <Link href={href} className={css.link}>
          {inner}
        </Link>
      )}
      {children}
    </div>
  );
}

/** Home page widgets, rendered from `SiteConfig.widgets` by `type` (Q14). */
export function Widgets({
  site,
  widgets,
  today,
  hrefs,
}: {
  site: SiteId;
  widgets: readonly Widget[];
  /** Day for the Bible reading; passed in so the caller decides how it is obtained. */
  today: Date;
  /** Slug routes of the widget targets (`resolveTargetHrefs`); missing → legacy `?id=` href. */
  hrefs?: TargetHrefs;
}) {
  return (
    <div className={css.widgets_wrapper}>
      {widgets.map((widget) => {
        const target = widgetTarget(widget);
        const href = target ? hrefOf(hrefs, target) : undefined;
        switch (widget.type) {
          case 'bible':
            return (
              <Card key={widget.type} widget={widget} icon={<LiaBibleSolid size="3em" />}>
                <p>{getReadingForDate(site, today)}</p>
              </Card>
            );
          case 'online':
            return (
              <Card
                key={widget.type}
                widget={widget}
                icon={<MdOutlineOnlinePrediction size="3em" />}
                href={href}
              />
            );
          case 'churchContacts':
            return (
              <Card key={widget.type} widget={widget} icon={<LuChurch size="3em" />} href={href} />
            );
          case 'category':
            return (
              <Card
                key={`${widget.type}-${widget.category}`}
                widget={widget}
                icon={<FaHandHoldingHeart size="3em" />}
                href={href}
              />
            );
          default: {
            const unhandled: never = widget;
            return unhandled;
          }
        }
      })}
    </div>
  );
}
