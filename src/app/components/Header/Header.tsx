import Image from 'next/image';

import { BurgerMenuButton, SearchForm, SocialIcons } from '@/app/components';
import logo from '../../assets/images/logo.webp';
import css from './Header.module.css';

const Header = () => {
    return (
        <header>
            <div className={css.header_top}>
                <h1> союз церквей <span className={css.red_text}> евангельских христиан-баптистов </span>молдовы </h1>
                <div className={css.social_wrapper}>
                    <SocialIcons/>
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