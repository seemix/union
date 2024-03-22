import React from 'react';

import css from './Header.module.css';

const Header = () => {
    return (
        <header className={css.header_wrapper}>
            <div className={css.header_overlay}></div>
            <h1>Союз церквей ЕХБ Молдовы</h1>
        </header>
    );
};

export default Header;