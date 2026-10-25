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

// Starting collections are empty: pieces come from the products you like and save.
export const INITIAL_COLLECTIONS: Collection[] = [
  { id: LIKED_ID, name: 'Liked items', isPrivate: true, itemIds: [], pieces: [] },
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
