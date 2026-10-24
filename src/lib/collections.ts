export interface Collection {
  id: string;
  name: string;
  /** Mock pieces already in the collection before anything is saved in this session. */
  baseCount: number;
  /** Items saved from Discover (ids from DISCOVER_ITEMS). */
  itemIds: string[];
  /** Mock cover photos for the pre-made collections; new ones use their first items. */
  covers?: string[];
}

export const LIKED_ID = 'liked';

const photo = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=${w}`;

// Mock starting collections until these come from Supabase.
export const INITIAL_COLLECTIONS: Collection[] = [
  { id: LIKED_ID, name: 'Liked items', baseCount: 11, itemIds: [], covers: [photo('1762605135012-56a59a059e60', 500), photo('1613915617430-8ab0fd7c6baf', 400)] },
  { id: 'layers', name: 'Everyday layers', baseCount: 8, itemIds: [], covers: [photo('1692180142575-c31fcd106b5b', 400), photo('1603189343302-e603f7add05a', 400)] },
  { id: 'occasion', name: 'Occasion', baseCount: 5, itemIds: [], covers: [photo('1659522761084-79196b64abe4', 600)] },
];
