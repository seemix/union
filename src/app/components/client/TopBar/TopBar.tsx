'use client';
import React, { useEffect, useState } from 'react';

import logo from './logo1.webp';
import css from './TopBar.module.css';

const TopBar = ({ children }: { children: React.ReactNode }) => {
    const [scroll, setScroll] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 80) setScroll(true);
            else setScroll(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className={!scroll ? css.top_bar : css.top_bar + ' ' + css.scroll}>
            {/*<img src={'https://baptist.org.md/ru/wp-content/uploads/2021/10/cropped-cropped-cropped-1234-1.png'}*/}
            <div className={css.logo_wrapper}><img src={logo.src} alt={'logo'}/></div>
            {children}
        </div>
    );
};

export default TopBar;