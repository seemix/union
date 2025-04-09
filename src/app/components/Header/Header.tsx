import Image from 'next/image';

import { BurgerMenuButton, SearchForm, SocialIcons } from '@/app/components';
import logo from '../../assets/images/logo.webp';
import css from './Header.module.css';

const Header = () => {
    return (
        <header>
            <div className={css.header_top}>
                <h1> Uniunea Bisericilor <span className={css.red_text}> Creștine Evanghelice Baptiste </span> din
                    Moldova </h1>
                <div className={css.social_wrapper}>
                    <SocialIcons/>
                </div>
            </div>
            <div className={css.header_wrapper}>
                <div className={css.logo_wrapper}>
                    <Image src={logo.src} alt={'logo'} fill/>
                </div>
                <SearchForm/>
                <BurgerMenuButton/>
            </div>
        </header>
    );
};

export default Header;