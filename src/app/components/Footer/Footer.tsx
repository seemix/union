import React from 'react';

import css from './Footer.module.css';
const Footer = () => {
    return (
        <footer className={css.footer_wrapper}>
            <div>г. Кишинев ул. Сергея Лазо 27/2
                т.  022 29 6701</div>
            <div></div>
            <div></div>
            <div></div>
            <small>Copyright c 2024 BAPTIST UNION OF MOLDOVA</small>
        </footer>
    );
};

export default Footer;