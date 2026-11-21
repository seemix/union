'use client';

import { MENU_ID } from '../menu-id';
import { useMenuState } from '../menu-state';
import css from './BurgerMenuButton.module.css';

export function BurgerMenuButton({ label }: { label: string }) {
  const { open, setOpen } = useMenuState();
  return (
    <button
      type="button"
      className={css.button_wrapper}
      onClick={() => setOpen(!open)}
      aria-label={label}
      aria-expanded={open}
      aria-controls={MENU_ID}
      data-menu-toggle
    >
      <span className={css.hamburger_menu}>
        <span className={css.top_bar} />
        <span className={css.center_bar} />
        <span className={css.center_bar} />
      </span>
    </button>
  );
}
