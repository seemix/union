'use client';

import React, { useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';

import { useAppContext } from '@/app/context/context';
import './TopBar.css';
import { SocialIcons } from '@/app/components';

const TopBar = ({ children }: { children: React.ReactNode }) => {
    const { state, setState } = useAppContext();
    const [classes, setClasses] = useState<string[]>(['']);

    useEffect(() => {
        if (state.openMenu) {
            setClasses(classes => !classes.includes('opened_menu') ? [...classes, 'opened_menu'] : [...classes]);
        } else {
            setClasses(classes => classes.filter(item => item !== 'opened_menu'));
        }
    }, [state]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 80) {
                setClasses(classes => !classes.includes('scroll') ? [...classes, 'scroll'] : [...classes]);
            } else {
                setClasses(classes => classes.filter(item => item !== 'scroll'));
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className={'top_bar ' + classes.join(' ')}>
            <div className={'close_button_wrapper'}>
                <SocialIcons/>
                <button onClick={() => setState(state.openMenu = false)}><IoMdClose size={'2.9em'}/></button>
            </div>
            {children}
        </div>
    );

};
export default TopBar;

