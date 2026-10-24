'use client';

import { useEffect, useRef, useState } from 'react';
import type { NavTab } from '@/components/ui/BottomNav';
import DiscoverScreen from '@/components/screens/DiscoverScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import FriendsScreen from '@/components/screens/FriendsScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import CollectionScreen from '@/components/screens/CollectionScreen';
import CartScreen from '@/components/screens/CartScreen';
import SearchScreen, { type StyleFilter } from '@/components/screens/SearchScreen';
import type { FeedTab, SwipeIntent } from '@/components/screens/DiscoverScreen';
import { INITIAL_FRIENDS, type Friend } from '@/lib/friends';
import DevNav, { type DevScreen } from '@/components/ui/DevNav';
import { findProduct } from '@/lib/discoverFeed';
import type { Variant } from '@/components/ui/ProductSheet';
import { REVIEWS, type Review } from '@/lib/reviews';
import { INITIAL_COLLECTIONS, LIKED_ID, type Collection } from '@/lib/collections';
import { cartItemIdFor, sortLikedFirst, toUiCollection, toUiFriend } from '@/lib/accountMapping';
import { fetchCartItems, fetchCollections, fetchFriendsWithCollections, recordSwipe, removeFromCart, toggleLikedItem } from '@/lib/supabase/api';
import { DEMO_USER_ID } from '@/lib/supabase/client';

/** Screens that sit outside the bottom-nav tabs. */
type Overlay = 'search' | 'settings' | 'cart' | 'collection' | null;
interface CartEntry {
  key: string;
  id: string;
  qty: number;
  color?: string;
  size?: string;
}

export default function AgoraApp() {
  const [nav, setNav] = useState<NavTab>('discover');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [filter, setFilter] = useState<StyleFilter | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>('For You');
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [userName, setUserName] = useState('Alex Rivera');
  const [darkMode, setDarkMode] = useState(false);
  const userHandle = '@alex_cal';

  // What "logging out" resets to: the mock data, or the account's data once Supabase has loaded it.
  const baseline = useRef<{ collections: Collection[]; friends: Friend[] }>({ collections: INITIAL_COLLECTIONS, friends: INITIAL_FRIENDS });

  // Load the demo account from Supabase. If it isn't configured (or comes back empty) the mock data stays.
  useEffect(() => {
    Promise.all([fetchCartItems(DEMO_USER_ID), fetchCollections(DEMO_USER_ID), fetchFriendsWithCollections(DEMO_USER_ID)])
      .then(([cartRows, accountCollections, accountFriends]) => {
        const cartEntries = cartRows.flatMap((row) => {
          const id = cartItemIdFor(row.product_id);
          return id ? [{ key: `${id}||`, id, qty: 1 }] : [];
        });
        if (cartEntries.length) setCart(cartEntries);

        if (accountCollections.length) {
          const mapped = sortLikedFirst(accountCollections.map(toUiCollection));
          baseline.current.collections = mapped;
          setCollections(mapped);
        }
        if (accountFriends.length) {
          const mapped = accountFriends.map(toUiFriend);
          baseline.current.friends = mapped;
          setFriends(mapped);
        }
      })
      .catch((error) => console.error('Error loading demo account:', error));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const cartCount = cart.reduce((n, e) => n + e.qty, 0);
  const cartLines = cart.flatMap((e) => {
    const item = findProduct(e.id);
    return item ? [{ key: e.key, item, qty: e.qty, color: e.color, size: e.size }] : [];
  });

  // The same product in the same colour and size stacks; a different size is its own line.
  const addToCart = (id: string, variant?: Variant) => {
    const key = [id, variant?.color ?? '', variant?.size ?? ''].join('|');
    setCart((c) =>
      c.some((e) => e.key === key)
        ? c.map((e) => (e.key === key ? { ...e, qty: e.qty + 1 } : e))
        : [...c, { key, id, qty: 1, color: variant?.color, size: variant?.size }],
    );
  };
  const changeQty = async (key: string, delta: 1 | -1) => {
    const entry = cart.find((e) => e.key === key);
    // Removing the last line for a product also removes it from the saved cart.
    if (entry && delta === -1 && entry.qty <= 1 && !cart.some((e) => e.id === entry.id && e.key !== key)) {
      const productId = findProduct(entry.id)?.productId;
      if (productId) await removeFromCart(productId, DEMO_USER_ID);
    }
    setCart((c) => c.flatMap((e) => (e.key !== key ? [e] : e.qty + delta <= 0 ? [] : [{ ...e, qty: e.qty + delta }])));
  };

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

  // Only "Liked items" is saved to Supabase so far. Other collections change locally.
  const toggleInCollection = async (collectionId: string, itemId: string) => {
    if (collectionId === LIKED_ID) {
      const productId = findProduct(itemId)?.productId;
      if (productId && !(await toggleLikedItem(productId, DEMO_USER_ID))) return;
    }
    setCollections((cs) =>
      cs.map((c) =>
        c.id !== collectionId
          ? c
          : { ...c, itemIds: c.itemIds.includes(itemId) ? c.itemIds.filter((i) => i !== itemId) : [...c.itemIds, itemId] },
      ),
    );
  };
  const createCollection = (name: string, itemId: string) =>
    setCollections((cs) => [...cs, { id: `c-${Date.now()}`, name, isPrivate: true, pieces: [], itemIds: [itemId] }]);

  const createEmptyCollection = (name: string, isPrivate: boolean) =>
    setCollections((cs) => [...cs, { id: `c-${Date.now()}`, name, isPrivate, pieces: [], itemIds: [] }]);
  const updateCollection = (id: string, patch: Partial<Pick<Collection, 'name' | 'isPrivate'>>) =>
    setCollections((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const deleteCollection = (id: string) => {
    setCollections((cs) => cs.filter((c) => c.id !== id));
    setOverlay(null);
    setOpenCollectionId(null);
  };
  const openCollection = (id: string) => {
    setOpenCollectionId(id);
    setOverlay('collection');
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
    const productId = findProduct(id)?.productId;
    if (productId) {
      const persisted = await recordSwipe(productId, intent === 'reject' ? 'left' : 'right', DEMO_USER_ID, intent === 'cart');
      if (!persisted) return;
    }

    if (intent === 'like') {
      const alreadyLiked = collections.some((c) => c.id === LIKED_ID && c.itemIds.includes(id));
      if (alreadyLiked) return;
      if (productId && !(await toggleLikedItem(productId, DEMO_USER_ID))) return;
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
    setCollections(baseline.current.collections);
    setFriends(baseline.current.friends);
    setCart([]);
    setMyReviews({});
    setDiscountCode(null);
    setFilter(null);
    setUserName('Alex Rivera');
    goTo('discover');
  };

  const renderScreen = () => {
    if (overlay === 'collection') {
      const collection = collections.find((c) => c.id === openCollectionId);
      if (collection) {
        return (
          <CollectionScreen
            nav="profile"
            onNav={goTo}
            onBack={() => goTo('profile')}
            collection={collection}
            onUpdate={(patch) => updateCollection(collection.id, patch)}
            onDelete={() => deleteCollection(collection.id)}
            onAddToCart={addToCart}
          />
        );
      }
    }
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
            onOpenCollection={openCollection}
            onCreateCollection={createEmptyCollection}
            myReviews={myReviews}
            onSaveReview={saveReview}
            name={userName}
            onOpenSettings={() => setOverlay('settings')}
          />
        );
      case 'gifts':
        return <FriendsScreen
            nav={nav}
            onNav={goTo}
            name={userName}
            handle={userHandle}
            friends={friends}
            onUnfriend={(tag) => setFriends((fs) => fs.filter((f) => f.tag !== tag))}
            onAddToCart={addToCart}
          />;
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

  const devScreen: DevScreen = overlay === 'collection' ? 'profile' : overlay ?? (nav === 'closet' ? 'search' : (nav as DevScreen));

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
