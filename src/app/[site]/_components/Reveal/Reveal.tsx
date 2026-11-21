import type { ReactNode } from 'react';
import css from './Reveal.module.css';

/**
 * Fades/slides its box in as it scrolls into view. Pure CSS (scroll-driven animation), so it
 * is a Server Component: no JS, nothing hidden in the server HTML (a JS-driven reveal starts at
 * `opacity: 0` until hydration, which delays LCP on list pages). Browsers without
 * `animation-timeline` simply show the box.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `${css.reveal} ${className}` : css.reveal}>{children}</div>;
}
