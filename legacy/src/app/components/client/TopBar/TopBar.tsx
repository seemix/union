'use client';

import React, { useEffect, useState, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';

import { useAppContext } from '@/app/context/context';
import './TopBar.css';
import { SocialIcons } from '@/app/components';
import { useOutsideClick } from '@/app/hooks/outsideClick';

const TopBar = ({ children }: { children: React.ReactNode }) => {
    const { state, setState } = useAppContext();
    const [classes, setClasses] = useState<string[]>(['']);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.openMenu) {
            setClasses(classes => !classes.includes('opened_menu') ? [...classes, 'opened_menu'] : [...classes]);
        } else {
            setClasses(classes => classes.filter(item => item !== 'opened_menu'));
        }
    }, [state]);
    const closeMenu = () => {
        setState({ openMenu: false });
    };

    useOutsideClick(menuRef, closeMenu);
    return (
        <div className={'top_bar ' + classes.join(' ')} ref={menuRef}>
            <div className={'close_button_wrapper'}>
                <SocialIcons/>
                <button onClick={closeMenu} aria-label={'close-menu'}><IoMdClose size={'2.9em'}/></button>
            </div>
            {children}
        </div>
    );

};
export default TopBar;

