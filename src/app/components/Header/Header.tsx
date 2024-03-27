import React from 'react';

import css from './Header.module.css';

const Header = () => {
    return (
        <header className={css.header_wrapper}>
            {/*<div className={css.header_overlay}></div>*/}
            <img src={'https://baptist.org.md/ru/wp-content/uploads/2021/10/cropped-cropped-cropped-1234-1.png'} width={200}/>
            {/*<h1>Союз церквей ЕХБ Молдовы</h1>*/}
        </header>
    );
};

export default Header;