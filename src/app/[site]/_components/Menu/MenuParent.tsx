'use client';

import {
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import css from './Menu.module.css';

/**
 * Menu item with a submenu: a disclosure button + the submenu list.
 * Mouse keeps the CSS `:hover` behaviour (desktop) and the accordion (mobile); the button
 * adds keyboard/touch access: Enter/Space/ArrowDown open, Esc closes and returns focus,
 * ArrowUp/ArrowDown move through the links, focus leaving the item closes it.
 */
export function MenuParent({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Esc also dismisses a submenu shown by hover, until the pointer leaves (WCAG 1.4.13).
  const [dismissed, setDismissed] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const links = () =>
    Array.from(itemRef.current?.querySelectorAll<HTMLElement>(`#${CSS.escape(listId)} a`) ?? []);

  const onKeyDown = (event: KeyboardEvent) => {
    const isButton = event.target === buttonRef.current;
    if (event.key === 'Escape') {
      if (open || !dismissed) {
        event.stopPropagation(); // the mobile drawer listens for Esc too
        setOpen(false);
        setDismissed(true);
        buttonRef.current?.focus();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const items = links();
      if (isButton && event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
        setDismissed(false);
        // Visible only after the state is applied.
        requestAnimationFrame(() => links()[0]?.focus());
      } else if (!isButton && items.length > 0) {
        event.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = event.key === 'ArrowDown' ? i + 1 : i - 1;
        if (next < 0) buttonRef.current?.focus();
        else items[Math.min(next, items.length - 1)]?.focus();
      }
    }
  };

  const onBlur = (event: FocusEvent) => {
    if (!itemRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  const classes = [open ? css.open : '', dismissed ? css.dismissed : ''].filter(Boolean).join(' ');

  return (
    <li
      ref={itemRef}
      className={classes || undefined}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onMouseLeave={() => setDismissed(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen(!open);
          setDismissed(false);
        }}
      >
        <span>
          {label} <i className={css.arrow_right} aria-hidden="true" />{' '}
        </span>
      </button>
      <ul id={listId}>{children}</ul>
    </li>
  );
}
