import { findProduct, type DiscoverItem } from '@/lib/discoverFeed';

/** A starting entry in a collection: a product id plus the tile's aspect ratio (width / height). */
export interface Piece {
  itemId: string;
  ratio: number;
}

/** A resolved tile: the product and how tall to draw its photo. */
export interface Tile {
  item: DiscoverItem;
  ratio: number;
}

export interface Collection {
  id: string;
  name: string;
  isPrivate: boolean;
  /** Mock pieces that were already in the collection before anything is saved in this session. */
  pieces: Piece[];
  /** Items saved from Discover (product ids). */
  itemIds: string[];
}

export const LIKED_ID = 'liked';

const COAT = { itemId: 'atelier-signature-coat', ratio: 0.75 };
const BLAZER = { itemId: 'frankie-oversized-tailoring', ratio: 1 };
const JACKET = { itemId: 'nicholson-volume-jacket', ratio: 0.8 };
const TRENCH = { itemId: 'everyday-trench', ratio: 0.66 };
const MIDI = { itemId: 'sculpted-midi', ratio: 0.9 };

export const ALL_PIECES: Piece[] = [COAT, BLAZER, JACKET, TRENCH, MIDI];

// Mock starting collections until these come from Supabase.
export const INITIAL_COLLECTIONS: Collection[] = [
  { id: LIKED_ID, name: 'Liked items', isPrivate: true, itemIds: [], pieces: [COAT, BLAZER, JACKET, TRENCH, MIDI] },
  { id: 'layers', name: 'Everyday layers', isPrivate: true, itemIds: [], pieces: [TRENCH, JACKET, BLAZER] },
  { id: 'occasion', name: 'Occasion', isPrivate: true, itemIds: [], pieces: [MIDI, COAT] },
];

/** Everything in a collection, in order: starting pieces first, then items saved from Discover. */
export function tilesOf(c: Collection): Tile[] {
  const resolve = (itemId: string, ratio: number): Tile[] => {
    const item = findProduct(itemId);
    return item ? [{ item, ratio }] : [];
  };
  return [
    ...c.pieces.filter((p) => !c.itemIds.includes(p.itemId)).flatMap((p) => resolve(p.itemId, p.ratio)),
    ...c.itemIds.flatMap((id) => resolve(id, 0.75)),
  ];
}

export const collectionCount = (c: Collection) => tilesOf(c).length;
