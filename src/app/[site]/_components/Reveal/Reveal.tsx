'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const STAGGER_STEP = 0.07;
const STAGGER_MAX_ITEMS = 6;

/** Fades/slides its box in once it enters the viewport; siblings stagger by `index`. */
export function Reveal({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        delay: (index % STAGGER_MAX_ITEMS) * STAGGER_STEP,
      }}
    >
      {children}
    </motion.div>
  );
}
