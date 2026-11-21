'use client';

import { useEffect, useState } from 'react';
import css from './ArrowUp.module.css';

const SHOW_AFTER_PX = 100;

export function ArrowUp({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  // Always rendered (CSS transition in/out); hidden from keyboard and AT while off-screen.
  return (
    <button
      type="button"
      className={`${css.arrow_up} ${visible ? css.visible : ''}`}
      onClick={scrollToTop}
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <big aria-hidden="true">⬆</big>
    </button>
  );
}
