'use client';

import React from 'react';

import css from './BurgerMenuButton.module.css';
import { useAppContext } from '@/app/context/context';

const BurgerMenuButton = () => {
    const { state, setState } = useAppContext();
    return (
        <button className={css.button_wrapper} onClick={() => setState({ openMenu: !state.openMenu })}>
            <label className={css.hamburger_menu}>
                <div className={css.top_bar}></div>
                <div className={css.center_bar}></div>
                <div className={css.center_bar}></div>
            </label>
        </button>

    );
};

export default BurgerMenuButton;