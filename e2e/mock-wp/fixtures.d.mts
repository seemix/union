export interface FixturePost {
  id: number;
  date: string;
  slug: string;
  status: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  views: number;
  categories: number[];
  _cat: number;
  _withImage: boolean;
}
export interface FixtureCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
}
export interface FixturePage {
  id: number;
  slug: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
}
export interface FixtureSite {
  categories: FixtureCategory[];
  pages: FixturePage[];
  posts: FixturePost[];
}
export const DATA: { ru: FixtureSite; ro: FixtureSite };
export const RARE_WORD: { ru: string; ro: string };
export function mediaFor(post: { id: number }, origin: string): unknown;
export function menuNodes(site: 'ru' | 'ro'): unknown[];
