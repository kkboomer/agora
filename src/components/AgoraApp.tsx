'use client';

import { useState } from 'react';
import type { NavTab } from '@/components/ui/BottomNav';
import DiscoverScreen from '@/components/screens/DiscoverScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import FriendsScreen from '@/components/screens/FriendsScreen';
import SearchScreen, { type StyleFilter } from '@/components/screens/SearchScreen';
import type { SwipeIntent } from '@/components/screens/DiscoverScreen';
import { DISCOVER_ITEMS } from '@/lib/discoverFeed';

export default function AgoraApp() {
  const [nav, setNav] = useState<NavTab>('discover');
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<StyleFilter | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(2); // mock starting count until a real cart exists

  const goTo = (tab: NavTab) => {
    if (tab === 'closet') {
      setSearching(true);
      return;
    }
    setSearching(false);
    setNav(tab);
  };
  const handleSwipe = (intent: SwipeIntent, id: string) => {
    if (intent === 'like') setLikedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
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
      return <ProfileScreen nav={nav} onNav={goTo} savedItems={DISCOVER_ITEMS.filter((i) => savedIds.includes(i.id))} likedCount={likedIds.length} />;
    case 'gifts':
      return <FriendsScreen nav={nav} onNav={goTo} />;
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
