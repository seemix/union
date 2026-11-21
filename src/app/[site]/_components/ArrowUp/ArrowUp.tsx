'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import css from './ArrowUp.module.css';

const SHOW_AFTER_PX = 100;

const variants: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  quit: { y: 100, opacity: 0, transition: { duration: 0.6 } },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 1 },
};

export function ArrowUp({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const scrollToTop = () => {
    document.documentElement.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className={css.arrow_up}
          onClick={scrollToTop}
          aria-label={label}
          variants={variants}
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          exit={reduceMotion ? undefined : 'quit'}
          whileHover={reduceMotion ? undefined : 'hover'}
          whileTap={reduceMotion ? undefined : 'tap'}
        >
          <big aria-hidden="true">⬆</big>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
