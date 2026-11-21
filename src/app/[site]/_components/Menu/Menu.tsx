import Link from 'next/link';
import type { SiteId } from '@/config/sites';
import { getMenu, type MenuItem } from '@/lib/wp';
import css from './Menu.module.css';
import { MenuParent } from './MenuParent';

/** The CSS supports one submenu level: deeper descendants are flattened into it. */
function flatten(items: readonly MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children)]);
}

function ItemLink({ item }: { item: MenuItem }) {
  if (item.href === null) return <span>{item.label}</span>;
  if (item.external) return <a href={item.href}>{item.label}</a>;
  return <Link href={item.href}>{item.label}</Link>;
}

export async function Menu({ site, label }: { site: SiteId; label: string }) {
  let items: readonly MenuItem[] = [];
  try {
    items = await getMenu(site);
  } catch (error) {
    // WP unavailable: the site must still render (header, content, footer).
    console.error(`[menu:${site}]`, error);
  }

  return (
    <nav className={css.menu} aria-label={label}>
      <ul>
        {items.map((item) => {
          const children = flatten(item.children);
          if (children.length === 0) {
            return (
              <li key={item.id}>
                <ItemLink item={item} />
              </li>
            );
          }
          return (
            <MenuParent key={item.id} label={item.label}>
              {children.map((child) => (
                <li key={child.id}>
                  <ItemLink item={child} />
                </li>
              ))}
            </MenuParent>
          );
        })}
      </ul>
    </nav>
  );
}
