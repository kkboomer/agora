'use client';

import { useEffect, useState } from 'react';
import type { NavTab } from '@/components/ui/BottomNav';
import DiscoverScreen from '@/components/screens/DiscoverScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import FriendsScreen from '@/components/screens/FriendsScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import CartScreen from '@/components/screens/CartScreen';
import SearchScreen, { type StyleFilter } from '@/components/screens/SearchScreen';
import type { FeedTab, SwipeIntent } from '@/components/screens/DiscoverScreen';
import DevNav, { type DevScreen } from '@/components/ui/DevNav';
import { DISCOVER_ITEMS } from '@/lib/discoverFeed';
import { REVIEWS, type Review } from '@/lib/reviews';
import { INITIAL_COLLECTIONS, LIKED_ID, type Collection } from '@/lib/collections';

/** Screens that sit outside the bottom-nav tabs. */
type Overlay = 'search' | 'settings' | 'cart' | null;
interface CartEntry {
  id: string;
  qty: number;
}

export default function AgoraApp() {
  const [nav, setNav] = useState<NavTab>('discover');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [filter, setFilter] = useState<StyleFilter | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>('For You');
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [userName, setUserName] = useState('Jordan Lee');
  const [darkMode, setDarkMode] = useState(false);
  const userHandle = '@jordanl';

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const cartCount = cart.reduce((n, e) => n + e.qty, 0);
  const cartLines = cart.flatMap((e) => {
    const item = DISCOVER_ITEMS.find((i) => i.id === e.id);
    return item ? [{ item, qty: e.qty }] : [];
  });

  const addToCart = (id: string) =>
    setCart((c) => (c.some((e) => e.id === id) ? c.map((e) => (e.id === id ? { ...e, qty: e.qty + 1 } : e)) : [...c, { id, qty: 1 }]));
  const changeQty = (id: string, delta: 1 | -1) =>
    setCart((c) => c.flatMap((e) => (e.id !== id ? [e] : e.qty + delta <= 0 ? [] : [{ ...e, qty: e.qty + delta }])));

  const saveReview = (itemId: string, rating: number, text: string) =>
    setMyReviews((m) => ({
      ...m,
      [itemId]: {
        id: `mine-${itemId}`,
        itemId,
        user: userHandle.replace('@', ''),
        color: '#24211d',
        rating: rating as Review['rating'],
        text,
        when: 'Just now',
        likes: 0,
      },
    }));
  // Your own reviews show first, ahead of everyone else's.
  const allReviews = [...Object.values(myReviews), ...REVIEWS];

  const toggleInCollection = (collectionId: string, itemId: string) =>
    setCollections((cs) =>
      cs.map((c) =>
        c.id !== collectionId
          ? c
          : { ...c, itemIds: c.itemIds.includes(itemId) ? c.itemIds.filter((i) => i !== itemId) : [...c.itemIds, itemId] },
      ),
    );
  const createCollection = (name: string, itemId: string) =>
    setCollections((cs) => [...cs, { id: `c-${Date.now()}`, name, baseCount: 0, itemIds: [itemId] }]);

  const goTo = (tab: NavTab) => {
    if (tab === 'closet') {
      setOverlay('search');
      return;
    }
    setOverlay(null);
    setNav(tab);
  };
  const handleSwipe = (intent: SwipeIntent, id: string) => {
    if (intent === 'like') {
      setCollections((cs) => cs.map((c) => (c.id === LIKED_ID && !c.itemIds.includes(id) ? { ...c, itemIds: [...c.itemIds, id] } : c)));
    }
    if (intent === 'cart') addToCart(id);
  };
  const runSearch = (query: string) => {
    setFilter({ query });
    goTo('discover');
  };
  const seeAll = (tab: FeedTab) => {
    setFeedTab(tab);
    setFilter(null);
    goTo('discover');
  };
  const handleLogout = () => {
    // Mock: there's no auth yet, so just reset the session state.
    setCollections(INITIAL_COLLECTIONS);
    setCart([]);
    setMyReviews({});
    setDiscountCode(null);
    setFilter(null);
    setUserName('Jordan Lee');
    goTo('discover');
  };

  const renderScreen = () => {
    if (overlay === 'cart') {
      return <CartScreen nav={nav} onNav={goTo} onBack={() => goTo(nav)} lines={cartLines} onChangeQty={changeQty} appliedCode={discountCode} onApplyCode={setDiscountCode} />;
    }
    if (overlay === 'settings') {
      return (
        <SettingsScreen
          nav="profile"
          onNav={goTo}
          onBack={() => goTo('profile')}
          name={userName}
          handle={userHandle}
          onChangeName={setUserName}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((v) => !v)}
          onLogout={handleLogout}
        />
      );
    }
    if (overlay === 'search') {
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
        return (
          <HomeScreen
            nav={nav}
            onNav={goTo}
            onOpenSearch={() => setOverlay('search')}
            onSearch={runSearch}
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            onOpenSettings={() => setOverlay('settings')}
            onSeeAll={seeAll}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            nav={nav}
            onNav={goTo}
            collections={collections}
            myReviews={myReviews}
            onSaveReview={saveReview}
            name={userName}
            onOpenSettings={() => setOverlay('settings')}
          />
        );
      case 'gifts':
        return <FriendsScreen nav={nav} onNav={goTo} name={userName} handle={userHandle} />;
      default:
        return (
          <DiscoverScreen
            nav={nav}
            onNav={goTo}
            feedTab={feedTab}
            onFeedTab={setFeedTab}
            filter={filter}
            onOpenSearch={() => setOverlay('search')}
            onClearFilter={() => setFilter(null)}
            collections={collections}
            onToggleCollection={toggleInCollection}
            onCreateCollection={createCollection}
            onSwipe={handleSwipe}
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            reviews={allReviews}
          />
        );
    }
  };

  const devScreen: DevScreen = overlay ?? (nav === 'closet' ? 'search' : (nav as DevScreen));

  return (
    <>
      {renderScreen()}
      {process.env.NODE_ENV !== 'production' && (
        <DevNav
          current={devScreen}
          onGo={(id) => (id === 'search' || id === 'settings' || id === 'cart' ? setOverlay(id) : goTo(id))}
        />
      )}
    </>
  );
}
