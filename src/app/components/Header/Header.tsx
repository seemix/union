import React from 'react';

import { Menu } from '@/app/components';
import css from './Header.module.css';
const Header = () => {
    return (
        <header className={css.header_wrapper}>
            <div className={css.header_overlay}></div>
            <h1>Союз церквей ЕХБ Молдовы</h1>
            {/*<div className={css.logo_wrapper}>*/}

            {/*</div>*/}
            {/*<div><Menu/></div>*/}
            {/*<img src={''} alt="logo" width={200}/>*/}
            {/*<h1>Baptist Union of MOLODVA</h1>*/}
        </header>
    );
};

export default Header;