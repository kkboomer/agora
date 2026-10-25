import type { DiscoverItem } from '@/lib/discoverFeed';

export interface FriendActivity {
  friendName: string;
  itemTitle: string;
  category: string;
  brand: string;
  itemId?: string;
}

const FRIEND_ACTIVITIES: FriendActivity[] = [
  {
    friendName: 'Alex',
    itemTitle: 'Relaxed wool overcoat',
    category: 'Outerwear',
    brand: 'Studio Nicholson',
  },
  {
    friendName: 'Maya',
    itemTitle: 'Vintage 501 jeans',
    category: 'Bottoms',
    brand: "Levi's",
  },
  {
    friendName: 'Jordan',
    itemTitle: 'Gel-Kinetic running shoes',
    category: 'Shoes',
    brand: 'ASICS',
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function categoriesMatch(itemCategory: string | undefined, activityCategory: string): boolean {
  if (!itemCategory) return false;
  const item = normalize(itemCategory);
  const activity = normalize(activityCategory);
  if (item === activity) return true;
  return (item === 'footwear' && activity === 'shoes') || (item === 'shoes' && activity === 'footwear');
}

function brandsMatch(itemBrand: string, activityBrand: string): boolean {
  const item = normalize(itemBrand);
  const activity = normalize(activityBrand);
  return item === activity || item.startsWith(activity) || activity.startsWith(item);
}

export function getFriendVibeMatch(
  item: DiscoverItem,
  friendActivities: FriendActivity[] = FRIEND_ACTIVITIES,
): { hasMatch: boolean; matchText: string; bonusObols: number } {
  const match = friendActivities.find(
    (activity) =>
      activity.itemId === item.id ||
      (brandsMatch(item.brand, activity.brand) &&
        categoriesMatch(item.category, activity.category)),
  );

  if (!match) {
    return { hasMatch: false, matchText: '', bonusObols: 0 };
  }

  return {
    hasMatch: true,
    matchText: `${match.friendName} loves ${match.brand} — Duo Vibe Match!`,
    bonusObols: 150,
  };
}
