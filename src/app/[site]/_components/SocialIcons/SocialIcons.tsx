import { FaFacebookF } from 'react-icons/fa6';
import { FaInstagram, FaYoutube } from 'react-icons/fa';
import type { SocialLinks } from '@/config/sites';
import css from './SocialIcons.module.css';

export function SocialIcons({ social }: { social: SocialLinks }) {
  return (
    <div className={css.social_icons}>
      <a href={social.facebook} aria-label="Facebook">
        <FaFacebookF size="1.6em" />
      </a>
      <a href={social.instagram} aria-label="Instagram">
        <FaInstagram size="1.7em" />
      </a>
      <a href={social.youtube} aria-label="YouTube">
        <FaYoutube size="1.8em" />
      </a>
    </div>
  );
}
