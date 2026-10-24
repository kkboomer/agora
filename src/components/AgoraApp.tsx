'use client';

import { useEffect, useState } from 'react';
import type { NavTab } from '@/components/ui/BottomNav';
import DiscoverScreen from '@/components/screens/DiscoverScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import FriendsScreen from '@/components/screens/FriendsScreen';
import SearchScreen, { type StyleFilter } from '@/components/screens/SearchScreen';
import type { SwipeIntent } from '@/components/screens/DiscoverScreen';
import { DISCOVER_ITEMS } from '@/lib/discoverFeed';
import { fetchCartItems, fetchCollections, fetchFriendsWithCollections, recordSwipe, toggleLikedItem } from '@/lib/supabase/api';
import { DEMO_USER_ID } from '@/lib/supabase/client';
import type { Collection, FriendWithCollections, Product } from '@/types/types';

export default function AgoraApp() {
  const [nav, setNav] = useState<NavTab>('discover');
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<StyleFilter | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [collections, setCollections] = useState<(Collection & { items: { product: Product }[] })[]>([]);
  const [friends, setFriends] = useState<FriendWithCollections[]>([]);

  useEffect(() => {
    Promise.all([fetchCartItems(DEMO_USER_ID), fetchCollections(DEMO_USER_ID), fetchFriendsWithCollections(DEMO_USER_ID)])
      .then(([cart, accountCollections, accountFriends]) => {
        setCartCount(cart.length);
        setCollections(accountCollections);
        setFriends(accountFriends);
      })
      .catch((error) => console.error('Error loading demo account:', error));
  }, []);

  const goTo = (tab: NavTab) => {
    if (tab === 'closet') {
      setSearching(true);
      return;
    }
    setSearching(false);
    setNav(tab);
  };
  const handleSwipe = async (intent: SwipeIntent, id: string) => {
    const item = DISCOVER_ITEMS.find((discoverItem) => discoverItem.id === id);
    if (!item) return;
    const persisted = await recordSwipe(item.productId, intent === 'reject' ? 'left' : 'right', DEMO_USER_ID, intent === 'cart');
    if (!persisted) return;
    if (intent === 'like') {
      const liked = await toggleLikedItem(item.productId);
      if (!liked) return;
      setCollections(await fetchCollections(DEMO_USER_ID));
    }
    if (intent === 'cart') setCartCount((n) => n + 1);
  };
  const openSearch = () => setSearching(true);
  const runSearch = (query: string) => {
    setFilter({ query });
    goTo('discover');
  };

  if (searching) {
    return (
      <SearchScreen
        nav="closet"
        onNav={goTo}
        initialGender={filter?.gender ?? 'women'}
        onSearch={runSearch}
        onSelect={(f) => {
          setFilter(f);
          goTo('discover');
        }}
      />
    );
  }

  switch (nav) {
    case 'home':
      return <HomeScreen nav={nav} onNav={goTo} onOpenSearch={openSearch} onSearch={runSearch} cartCount={cartCount} />;
    case 'profile':
      return <ProfileScreen nav={nav} onNav={goTo} savedItems={DISCOVER_ITEMS.filter((i) => savedIds.includes(i.id))} collections={collections} />;
    case 'gifts':
      return <FriendsScreen nav={nav} onNav={goTo} friends={friends} />;
    default:
      return (
        <DiscoverScreen
          nav={nav}
          onNav={goTo}
          filter={filter}
          onOpenSearch={openSearch}
          onClearFilter={() => setFilter(null)}
          savedIds={savedIds}
          onToggleSaved={(id) => setSavedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))}
          onSwipe={handleSwipe}
          cartCount={cartCount}
        />
      );
  }
}
