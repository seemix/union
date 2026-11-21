import Link from 'next/link';
import { FaRegAddressCard } from 'react-icons/fa';
import { FaPhoneVolume } from 'react-icons/fa6';
import { MdOutlineEmail } from 'react-icons/md';
import type { SiteConfig } from '@/config/sites';
import { targetHref } from '@/lib/site/href';
import { SocialIcons } from '../SocialIcons/SocialIcons';
import css from './Footer.module.css';

export function Footer({ site }: { site: SiteConfig }) {
  const { columns, contacts, social, copyright } = site.footer;
  return (
    <footer className={css.footer_wrapper}>
      <div className={css.footer_top}>
        {columns.map((column) => (
          <div key={column.title} className={css.footer_block}>
            <h4>{column.title}</h4>
            <div>
              {column.links.map((link) => (
                <Link key={link.label} href={targetHref(link.target)}>
                  <p>{link.label}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className={css.footer_block}>
          <h4>{contacts.title}</h4>
          <div className={css.contacts_wrapper}>
            <FaRegAddressCard size="1.2em" />
            {contacts.address}
          </div>
          <div className={css.contacts_wrapper}>
            <FaPhoneVolume /> {contacts.phone}
          </div>
          <div className={css.contacts_wrapper}>
            <MdOutlineEmail size="1.4em" /> {contacts.email}
          </div>
        </div>
      </div>
      <div className={css.footer_bottom}>
        <small>{copyright}</small>
        <SocialIcons social={social} />
      </div>
    </footer>
  );
}
