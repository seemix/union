import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaFacebookF } from 'react-icons/fa6';

import logo from '../../assets/images/logo.webp';
import css from './Header.module.css';

const Header = () => {
    return (
        <header className={css.header_wrapper}>
            <div className={css.logo_wrapper}>
                <Image src={logo.src} alt={'logo'} layout={'fill'} objectFit={'cover'}/>
            </div>
            <h1>
                СОЮЗ ЦЕРКВЕЙ
                <span className={css.red_text}>евангельских христиан-баптистов</span>
                МОЛДОВЫ
            </h1>
            <div className={css.social_wrapper}>
                <Link href={''}> <FaFacebookF size={'1.4em'}/></Link>
                <Link href={''}> <FaInstagram size={'1.5em'}/></Link>
                <Link href={''}> <FaYoutube size={'1.6em'}/></Link>
            </div>
            {/*<div>[--]</div>*/}
        </header>
    );
};

export default Header;