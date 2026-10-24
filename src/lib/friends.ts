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

/** Mock people you can find and add. No request or approval: adding is instant. */
export const PEOPLE: Friend[] = [
  { name: 'Jordan Lee', tag: '@jordanl', initial: 'J', color: '#7a6a8c', collections: collectionsFor('jordan', 1) },
  { name: 'Priya Shah', tag: '@priyas', initial: 'P', color: '#b0785f', collections: collectionsFor('priya', 2) },
  { name: 'Theo Martin', tag: '@theom', initial: 'T', color: '#5f7a78', collections: collectionsFor('theo', 3) },
  { name: 'Ines Costa', tag: '@inesc', initial: 'I', color: '#a1695d', collections: collectionsFor('ines', 0) },
  { name: 'Liam Carter', tag: '@liamc', initial: 'L', color: '#6a7388', collections: collectionsFor('liam', 4) },
  { name: 'Zoe Bennett', tag: '@zoeb', initial: 'Z', color: '#8c7a5e', collections: collectionsFor('zoe', 2) },
  { name: 'Kai Tanaka', tag: '@kait', initial: 'K', color: '#6c8070', collections: collectionsFor('kai', 1) },
  { name: 'Ava Nguyen', tag: '@avan', initial: 'A', color: '#9c6b80', collections: collectionsFor('ava', 3) },
];
