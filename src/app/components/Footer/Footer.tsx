import React from 'react';
import { FaPhoneVolume } from 'react-icons/fa6';
import { MdOutlineEmail } from 'react-icons/md';
import { FaRegAddressCard } from 'react-icons/fa';
import Link from 'next/link';

import { SocialIcons } from '@/app/components';
import css from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={css.footer_wrapper}>
            <div className={css.footer_top}>
                <div className={css.footer_block}>
                    <h4>DESPRE NOI</h4>
                    <div>
                        <Link href={'page?id=893'}><p>ISTORIA</p></Link>
                        <Link href={'page?id=901'}><p>MĂRTURISIREA DE CREDINȚĂ</p></Link>
                        <Link href={'page?id=898'}><p>STRUCTURA UBCEB</p></Link>
                    </div>
                </div>
                <div className={css.footer_block}>
                    <h4>ŞTIRI</h4>
                    <div>
                        <Link href={'category?id=23'}><p>ŞTIRI INTERNE</p></Link>
                        <Link href={'category?id=22'}><p>ŞTIRI EXTERNE</p></Link>
                    </div>
                </div>
                <div className={css.footer_block}>
                    <h4>contacte</h4>
                    <div className={css.contacts_wrapper}><FaRegAddressCard size={'1.2em'}/>str. Serghei Lazo 27/2
                    </div>
                    <div className={css.contacts_wrapper}><FaPhoneVolume/> +373 22 29 6701</div>
                    <div className={css.contacts_wrapper}><MdOutlineEmail size={'1.4em'}/> baptunion@yahoo.com</div>
                </div>
            </div>
            <div className={css.footer_bottom}>
                <small>copyright © 2024 BAPTIST UNION OF MOLDOVA</small>
                <SocialIcons/>
            </div>
        </footer>
    );
};

export default Footer;