'use client';
import React, { useEffect, useState } from 'react';

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
            {children}
        </div>
    );
};

export default TopBar;