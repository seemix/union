'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface MenuState {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

const MenuStateContext = createContext<MenuState | null>(null);

/** Open/closed state of the mobile menu, shared by the burger button and the TopBar. */
export function MenuStateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <MenuStateContext value={value}>{children}</MenuStateContext>;
}

export function useMenuState(): MenuState {
  const state = useContext(MenuStateContext);
  if (!state) throw new Error('useMenuState must be used inside <MenuStateProvider>');
  return state;
}
