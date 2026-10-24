import { CATALOG } from '@/lib/discoverFeed';
import { LIKED_ID, type Collection } from '@/lib/collections';
import type { Friend } from '@/lib/friends';
import type { Collection as DbCollection, FriendWithCollections, Product as DbProduct } from '@/types/types';

type DbCollectionWithItems = DbCollection & { items: { product: DbProduct }[] };

const productToItemId = (productId: string) => CATALOG.find((i) => i.productId === productId)?.id;

const AVATAR_COLORS = ['#aa7058', '#647277', '#82715f', '#6e7562', '#9a6d72'];

/** Supabase collection -> the shape the UI uses. Products that aren't in the catalog yet are skipped. */
export function toUiCollection(c: DbCollectionWithItems): Collection {
  return {
    id: c.name === 'Liked items' ? LIKED_ID : c.id,
    name: c.name,
    isPrivate: !c.is_public,
    pieces: [],
    itemIds: c.items.flatMap((i) => {
      const id = productToItemId(i.product.id);
      return id ? [id] : [];
    }),
  };
}

export const sortLikedFirst = (cs: Collection[]) => [...cs].sort((a, b) => Number(b.id === LIKED_ID) - Number(a.id === LIKED_ID));

export function toUiFriend(f: FriendWithCollections, index: number): Friend {
  return {
    name: f.profile.display_name,
    tag: `@${f.profile.username}`,
    initial: f.profile.display_name[0] ?? '?',
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    collections: sortLikedFirst(f.collections.map(toUiCollection)),
  };
}

export const cartItemIdFor = (productId: string) => productToItemId(productId);
