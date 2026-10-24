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
import { REVIEWS } from '@/lib/reviews';
import { LIKED_ID, type Collection as UiCollection } from '@/lib/collections';
import { fetchCartItems, fetchCollections, fetchFriendsWithCollections, recordSwipe, removeFromCart, toggleLikedItem } from '@/lib/supabase/api';
import { DEMO_USER_ID } from '@/lib/supabase/client';
import type { Collection as DbCollection, FriendWithCollections, Product as DbProduct } from '@/types/types';

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
  const [collections, setCollections] = useState<(DbCollection & { items: { product: DbProduct }[] })[]>([]);
  const [friends, setFriends] = useState<FriendWithCollections[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [userName, setUserName] = useState('Alex Rivera');
  const [darkMode, setDarkMode] = useState(false);
  const userHandle = '@alex_cal';

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  useEffect(() => {
    Promise.all([fetchCartItems(DEMO_USER_ID), fetchCollections(DEMO_USER_ID), fetchFriendsWithCollections(DEMO_USER_ID)])
      .then(([cartRows, accountCollections, accountFriends]) => {
        setCart(
          cartRows.flatMap((item) => {
            const discoverItem = DISCOVER_ITEMS.find((candidate) => candidate.productId === item.product_id);
            return discoverItem ? [{ id: discoverItem.id, qty: 1 }] : [];
          })
        );
        setCollections(accountCollections);
        setFriends(accountFriends);
      })
      .catch((error) => console.error('Error loading demo account:', error));
  }, []);

  const cartCount = cart.reduce((n, e) => n + e.qty, 0);
  const cartLines = cart.flatMap((e) => {
    const item = DISCOVER_ITEMS.find((i) => i.id === e.id);
    return item ? [{ item, qty: e.qty }] : [];
  });

  const uiCollections: UiCollection[] = collections
    .map((collection) => ({
      id: collection.name === 'Liked items' ? LIKED_ID : collection.id,
      name: collection.name,
      baseCount: 0,
      itemIds: collection.items.flatMap((item) => {
        const discoverItem = DISCOVER_ITEMS.find((candidate) => candidate.productId === item.product.id);
        return discoverItem ? [discoverItem.id] : [];
      }),
      covers: collection.items.slice(0, 2).map((item) => item.product.image_url),
    }))
    .sort((a, b) => Number(b.id === LIKED_ID) - Number(a.id === LIKED_ID));

  const likedCollection = collections.find((collection) => collection.name === 'Liked items');
  const likedItems = likedCollection
    ? likedCollection.items.flatMap((item) => {
      const discoverItem = DISCOVER_ITEMS.find((candidate) => candidate.productId === item.product.id);
      return discoverItem ? [discoverItem] : [];
    })
    : [];

  const addToCart = (id: string) =>
    setCart((c) => (c.some((e) => e.id === id) ? c.map((e) => (e.id === id ? { ...e, qty: e.qty + 1 } : e)) : [...c, { id, qty: 1 }]));

  const changeQty = async (id: string, delta: 1 | -1) => {
    const current = cart.find((entry) => entry.id === id)?.qty ?? 0;
    if (delta === -1 && current <= 1) {
      const discoverItem = DISCOVER_ITEMS.find((item) => item.id === id);
      if (discoverItem) await removeFromCart(discoverItem.productId, DEMO_USER_ID);
    }

    setCart((c) => c.flatMap((e) => (e.id !== id ? [e] : e.qty + delta <= 0 ? [] : [{ ...e, qty: e.qty + delta }])));
  };

  const toggleInCollection = async (collectionId: string, itemId: string) => {
    const discoverItem = DISCOVER_ITEMS.find((item) => item.id === itemId);
    if (!discoverItem) return;

    const canToggleLiked = collectionId === LIKED_ID || collections.some((collection) => collection.id === collectionId && collection.name === 'Liked items');
    if (!canToggleLiked) return;

    const liked = await toggleLikedItem(discoverItem.productId, DEMO_USER_ID);
    if (!liked) return;
    setCollections(await fetchCollections(DEMO_USER_ID));
  };

  const createCollection = () => {
    // New collection creation is not yet wired to Supabase.
  };

  const goTo = (tab: NavTab) => {
    if (tab === 'closet') {
      setOverlay('search');
      return;
    }
    setOverlay(null);
    setNav(tab);
  };

  const handleSwipe = async (intent: SwipeIntent, id: string) => {
    const item = DISCOVER_ITEMS.find((discoverItem) => discoverItem.id === id);
    if (!item) return;

    const persisted = await recordSwipe(item.productId, intent === 'reject' ? 'left' : 'right', DEMO_USER_ID, intent === 'cart');
    if (!persisted) return;

    if (intent === 'like') {
      const liked = await toggleLikedItem(item.productId, DEMO_USER_ID);
      if (!liked) return;
      setCollections(await fetchCollections(DEMO_USER_ID));
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
    setCart([]);
    setDiscountCode(null);
    setFilter(null);
    setUserName('Alex Rivera');
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
            savedItems={likedItems}
            collections={collections}
            name={userName}
            onOpenSettings={() => setOverlay('settings')}
          />
        );
      case 'gifts':
        return <FriendsScreen nav={nav} onNav={goTo} friends={friends} name={userName} handle={userHandle} />;
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
            collections={uiCollections}
            onToggleCollection={toggleInCollection}
            onCreateCollection={createCollection}
            onSwipe={handleSwipe}
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            reviews={REVIEWS}
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
