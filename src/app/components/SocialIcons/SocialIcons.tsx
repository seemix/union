import React from 'react';
import Link from 'next/link';
import { FaFacebookF } from 'react-icons/fa6';
import { FaInstagram, FaYoutube } from 'react-icons/fa';

import { faceBookUrl, instagramUrl, youtubeUrl } from '@/app/assets/common';
import css from './SocialIcons.module.css';

const SocialIcons = () => {
    return (
        <div className={css.social_icons}>
            <Link href={faceBookUrl} aria-label={'Facebook'}> <FaFacebookF size={'1.6em'}/></Link>
            <Link href={instagramUrl} aria-label={'Instagram'}> <FaInstagram size={'1.7em'}/></Link>
            <Link href={youtubeUrl} aria-label={'Youtube'}> <FaYoutube size={'1.8em'}/></Link>
        </div>
    );
};

export default SocialIcons;