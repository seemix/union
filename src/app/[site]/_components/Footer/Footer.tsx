import Link from 'next/link';
import { FaRegAddressCard } from 'react-icons/fa';
import { FaPhoneVolume } from 'react-icons/fa6';
import { MdOutlineEmail } from 'react-icons/md';
import type { SiteConfig } from '@/config/sites';
import { hrefOf } from '@/lib/site/href';
import { resolveTargetHrefs } from '@/lib/site/targets';
import { SocialIcons } from '../SocialIcons/SocialIcons';
import css from './Footer.module.css';

export async function Footer({ site }: { site: SiteConfig }) {
  const { columns, contacts, social, copyright } = site.footer;
  const hrefs = await resolveTargetHrefs(
    site.id,
    columns.flatMap((column) => column.links.map((link) => link.target)),
  );
  return (
    <footer className={css.footer_wrapper}>
      <div className={css.footer_top}>
        {columns.map((column) => (
          <div key={column.title} className={css.footer_block}>
            <h4>{column.title}</h4>
            <div>
              {column.links.map((link) => (
                <Link key={link.label} href={hrefOf(hrefs, link.target)}>
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
