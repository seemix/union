import React from 'react';
import Image from 'next/image';

import logo from '../../assets/images/logo.webp';
import css from './Header.module.css';

const Header = () => {
    return (
        <header className={css.header_wrapper}>
            <Image src={logo.src} alt={'logo'} width={125} height={125}/>
            <h1>
                СОЮЗ ЦЕРКВЕЙ
                <span className={css.red_text}>евангельских христиан-баптистов</span>
                МОЛДОВЫ
            </h1>
        </header>
    );
};

export default Header;