import Image from 'next/image';
import type { SiteConfig } from '@/config/sites';
import type { Dictionary } from '@/i18n';
import { BurgerMenuButton } from '../BurgerMenuButton/BurgerMenuButton';
import { SearchForm } from '../SearchForm/SearchForm';
import { SocialIcons } from '../SocialIcons/SocialIcons';
import css from './Header.module.css';

export function Header({ site, dict }: { site: SiteConfig; dict: Dictionary }) {
  const { before, accent, after } = site.headerTitle;
  return (
    <header>
      <div className={css.header_top}>
        <h1>
          {before}
          <span className={css.red_text}>{accent}</span>
          {after}
        </h1>
        <div className={css.social_wrapper}>
          <SocialIcons social={site.footer.social} />
        </div>
      </div>
      <div className={css.header_wrapper}>
        <div className={css.logo_wrapper}>
          <Image src={site.logo} alt={dict.a11y.logo} sizes="100px" fill priority />
        </div>
        <SearchForm placeholder={dict.search.placeholder} label={dict.a11y.search} />
        <BurgerMenuButton label={dict.a11y.menu} />
      </div>
    </header>
  );
}
