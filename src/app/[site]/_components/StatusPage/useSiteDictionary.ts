'use client';

import { useParams } from 'next/navigation';
import type { Dictionary } from '@/i18n';
import { ro } from '@/i18n/ro';
import { ru } from '@/i18n/ru';

const dictionaries: Readonly<Record<string, Dictionary>> = { ru, ro };

/**
 * Dictionary of the current site for the client error boundary (`error.tsx`):
 * it receives no `params`, and `next/root-params` is server-only, so the `[site]`
 * route param (via `useParams`) picks the locale.
 * Both dictionaries are small; they only ship with the error chunk.
 * Falls back to ru (the layout already 404s unknown sites).
 */
export function useSiteDictionary(): Dictionary {
  const { site } = useParams<{ site?: string }>();
  return (site && dictionaries[site]) || ru;
}
