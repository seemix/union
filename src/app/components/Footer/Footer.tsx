import React from 'react';
import { FaPhoneVolume } from 'react-icons/fa6';
import { MdOutlineEmail } from 'react-icons/md';
import { FaRegAddressCard } from 'react-icons/fa';
import Link from 'next/link';

import { SocialIcons } from '@/app/components';
import css from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={css.footer_wrapper}>
            <div className={css.footer_top}>
                <div className={css.footer_block}>
                    <h4>о союзе ЕХБ</h4>
                    <div>
                        <Link href={'page?id=11'}><p>ИСТОРИЯ</p></Link>
                        <Link href={'page?id=12'}><p>ВЕРОУЧЕНИЕ</p></Link>
                        <Link href={'page?id=14'}><p>СТРУКТУРА</p></Link>
                    </div>
                </div>
                <div className={css.footer_block}>
                    <h4>новости</h4>
                    <div>
                        <Link href={'category?id=17'}><p>НОВОСТИ БРАТСТВА</p></Link>
                        <Link href={'category?id=27'}><p>ХРИСТИАНЕ В МИРЕ</p></Link>
                    </div>
                </div>
                <div className={css.footer_block}>
                    <h4>Контакты</h4>
                    <div className={css.contacts_wrapper}><FaRegAddressCard size={'1.2em'}/>г. Кишинев ул. Сергея Лазо
                        27/2
                    </div>
                    <div className={css.contacts_wrapper}><FaPhoneVolume/> +373 22 29 6701</div>
                    <div className={css.contacts_wrapper}><MdOutlineEmail size={'1.4em'}/> baptunion@yahoo.com</div>
                </div>
            </div>
            <div className={css.footer_bottom}>
                <small>copyright © 2024 BAPTIST UNION OF MOLDOVA</small>
                <SocialIcons/>
            </div>
        </footer>
    );
};

export default Footer;