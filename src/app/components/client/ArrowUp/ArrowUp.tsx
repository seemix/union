'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { arrowUpAnimation } from './animation';
import css from './ArrowUp.module.css';


const ArrowUp = () => {

    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const updatePosition = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('scroll', updatePosition);

        return () => window.removeEventListener('scroll', updatePosition);
    }, []);
    const scrollToTop = () => {
        document.documentElement.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            {scrollPosition > 100 &&
                <motion.button className={css.arrow_up}
                               onClick={scrollToTop}
                               variants={arrowUpAnimation}
                               exit={'quit'}
                               whileHover={'hover'}
                               whileTap={'tap'}
                >
                    <big>⬆</big>
                </motion.button>
            }
        </>
    );
};

export default ArrowUp;