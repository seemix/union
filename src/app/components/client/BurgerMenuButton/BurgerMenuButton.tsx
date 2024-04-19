'use client';

import React from 'react';

import { useAppContext } from '@/app/context/context';
import css from './BurgerMenuButton.module.css';

const BurgerMenuButton = () => {
    const { state, setState } = useAppContext();
    return (
        <button className={css.button_wrapper}
                onClick={() => setState({ openMenu: !state.openMenu })}
                aria-label={'menu'}>
            <label className={css.hamburger_menu}>
                <div className={css.top_bar}></div>
                <div className={css.center_bar}></div>
                <div className={css.center_bar}></div>
            </label>
        </button>

    );
};

export default BurgerMenuButton;