import Image from 'next/image';
import Link from 'next/link';
import { FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaFacebookF } from 'react-icons/fa6';

import { BurgerMenuButton, SearchForm } from '@/app/components';
import logo from '../../assets/images/logo.webp';
import css from './Header.module.css';

const Header = () => {
    return (
        <header>
            <div className={css.header_top}>
                <h1> союз церквей <span className={css.red_text}> евангельских христиан-баптистов </span>молдовы </h1>
                <div className={css.social_wrapper}>
                    <Link href={''}> <FaFacebookF size={'1.3em'}/></Link>
                    <Link href={''}> <FaInstagram size={'1.4em'}/></Link>
                    <Link href={''}> <FaYoutube size={'1.5em'}/></Link>
                </div>
            </div>
            <div className={css.header_wrapper}>
                <div className={css.logo_wrapper}>
                    <Image src={logo.src} alt={'logo'} layout={'fill'} objectFit={'cover'}/>
                </div>
                <SearchForm/>
                <BurgerMenuButton/>
            </div>
        </header>
    );
};

export default Header;