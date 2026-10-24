import { ALL_PIECES, type Collection } from '@/lib/collections';

export interface Friend {
  name: string;
  /** Includes the leading @ */
  tag: string;
  initial: string;
  color: string;
  /** Public collections you can browse. */
  collections: Collection[];
}

const rotate = <T,>(list: T[], by: number) => [...list.slice(by % list.length), ...list.slice(0, by % list.length)];

// Mock public collections per friend, built from the same catalog.
const collectionsFor = (key: string, seed: number): Collection[] => [
  { id: `${key}-liked`, name: 'Liked items', isPrivate: false, itemIds: [], pieces: rotate(ALL_PIECES, seed) },
  { id: `${key}-city`, name: 'City layers', isPrivate: false, itemIds: [], pieces: rotate(ALL_PIECES, seed + 1).slice(0, 3) },
  { id: `${key}-later`, name: 'For later', isPrivate: false, itemIds: [], pieces: rotate(ALL_PIECES, seed + 2).slice(0, 2) },
];

export const INITIAL_FRIENDS: Friend[] = [
  { name: 'Maya Chen', tag: '@mayawears', initial: 'M', color: '#aa7058', collections: collectionsFor('maya', 0) },
  { name: 'Alex Morgan', tag: '@alexm', initial: 'A', color: '#647277', collections: collectionsFor('alex', 1) },
  { name: 'Sofia Reyes', tag: '@sofiar', initial: 'S', color: '#82715f', collections: collectionsFor('sofia', 2) },
  { name: 'Noah Williams', tag: '@noahw', initial: 'N', color: '#6e7562', collections: collectionsFor('noah', 3) },
  { name: 'Camille Park', tag: '@camillep', initial: 'C', color: '#9a6d72', collections: collectionsFor('camille', 4) },
];
