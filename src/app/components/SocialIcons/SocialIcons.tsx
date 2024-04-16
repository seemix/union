import React from 'react';
import Link from 'next/link';
import { FaFacebookF } from 'react-icons/fa6';
import { FaInstagram, FaYoutube } from 'react-icons/fa';

import css from './SocialIcons.module.css';

const SocialIcons = () => {
    return (
        <div className={css.social_icons}>
            <Link href={''}> <FaFacebookF size={'1.6em'}/></Link>
            <Link href={''}> <FaInstagram size={'1.7em'}/></Link>
            <Link href={''}> <FaYoutube size={'1.8em'}/></Link>
        </div>
    );
};

export default SocialIcons;