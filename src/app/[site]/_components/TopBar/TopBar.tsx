'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { IoMdClose } from 'react-icons/io';
import { useMenuState } from '../menu-state';
import css from './TopBar.module.css';

interface TopBarProps {
  /** Social icons shown at the top of the mobile drawer. */
  readonly social: ReactNode;
  /** The menu. */
  readonly children: ReactNode;
  readonly closeLabel: string;
}

/** Sticky menu bar on desktop, slide-in drawer on mobile. */
export function TopBar({ social, children, closeLabel }: TopBarProps) {
  const { open, setOpen } = useMenuState();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      // The burger button toggles by itself.
      if (ref.current?.contains(target) || target.closest('[data-menu-toggle]')) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  // Navigating from the drawer closes it (the layout persists between pages).
  const onClick = (event: MouseEvent) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  };

  return (
    <div
      ref={ref}
      className={open ? `${css.top_bar} ${css.opened_menu}` : css.top_bar}
      onClick={onClick}
    >
      <div className={css.close_button_wrapper}>
        {social}
        <button type="button" onClick={() => setOpen(false)} aria-label={closeLabel}>
          <IoMdClose size="2.9em" />
        </button>
      </div>
      {children}
    </div>
  );
}
