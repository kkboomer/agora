'use client';

import { useEffect, useRef, useState } from 'react';
import type { NavTab } from '@/components/ui/BottomNav';
import DiscoverScreen from '@/components/screens/DiscoverScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import FriendsScreen from '@/components/screens/FriendsScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import AuthScreen from '@/components/screens/AuthScreen';
import ProductScreen from '@/components/screens/ProductScreen';
import CollectionScreen from '@/components/screens/CollectionScreen';
import CartScreen from '@/components/screens/CartScreen';
import { EMPTY_FILTERS, type ProductFilters } from '@/lib/filters';
import SearchScreen, { type StyleFilter } from '@/components/screens/SearchScreen';
import type { FeedTab, SwipeIntent } from '@/components/screens/DiscoverScreen';
import type { Friend } from '@/lib/friends';
import DevNav, { type DevScreen } from '@/components/ui/DevNav';
import { DISCOVER_ITEMS, findProduct } from '@/lib/discoverFeed';
import type { Variant } from '@/components/ui/ProductSheet';
import { REVIEWS, type Review } from '@/lib/reviews';
import { INITIAL_COLLECTIONS, LIKED_ID, type Collection } from '@/lib/collections';
import { AVATAR_COLORS, cartItemIdFor, sortLikedFirst, toUiCollection, toUiFriend } from '@/lib/accountMapping';
import { currentUser, signIn, signOut, signUp, type AuthUser } from '@/lib/supabase/auth';
import { addFriendship, removeFriendship, searchProfiles, fetchAvatar, fetchCartItems, fetchCollections, fetchFriendsWithCollections, recordSwipe, removeAvatar, removeFromCart, toggleLikedItem, uploadAvatar } from '@/lib/supabase/api';
import { DEMO_USER_ID, isSupabaseConfigured } from '@/lib/supabase/client';

/** Screens that sit outside the bottom-nav tabs. */
type Overlay = 'search' | 'settings' | 'cart' | 'collection' | 'product' | null;
interface CartEntry {
  key: string;
  id: string;
  qty: number;
  color?: string;
  size?: string;
}

const GUEST_LIKED_KEY = 'agora.guestLiked';

export default function AgoraApp() {
  const [nav, setNav] = useState<NavTab>('discover');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StyleFilter | null>(null);
  // Product filters (size, colour, price...) are set from Home or Discover and applied in Discover.
  const [productFilters, setProductFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [feedTab, setFeedTab] = useState<FeedTab>('For You');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [userName, setUserName] = useState('Alex Rivera');
  const [darkMode, setDarkMode] = useState(false);
  const [userHandle, setUserHandle] = useState('@alex_cal');
  // null until the person logs in, signs up or continues as a guest.
  const [session, setSession] = useState<'member' | 'guest' | null>(null);
  // Whose data to load and save: the signed-in account, or the shared demo account for guests.
  const [userId, setUserId] = useState(DEMO_USER_ID);
  // Guests browse with local data only: nothing is read from or written to the database.
  const signedIn = session === 'member';
  // False until we've checked for a saved login, so a returning user doesn't see the login screen flash.
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  // What "logging out" resets to: the mock data, or the account's data once Supabase has loaded it.
  const baseline = useRef<{ collections: Collection[]; friends: Friend[] }>({ collections: INITIAL_COLLECTIONS, friends: [] });

  // A brand-new account starts empty, not with the mock collections and friends.
  const applyAccount = (user: AuthUser) => {
    const empty: Collection[] = [{ id: LIKED_ID, name: 'Liked items', isPrivate: true, pieces: [], itemIds: [] }];
    baseline.current = { collections: empty, friends: [] };
    setCollections(empty);
    setFriends([]);
    setCart([]);
    setMyReviews({});
    setUserId(user.id);
    setUserName(user.name);
    setUserHandle(user.handle);
    setUserPhoto(user.avatarUrl);
    setNav('discover');
    setOverlay(null);
    setSession('member');
  };

  // Guests get only their locally saved liked items, kept in this browser.
  const applyGuest = () => {
    let liked: string[] = [];
    try {
      liked = JSON.parse(localStorage.getItem(GUEST_LIKED_KEY) ?? '[]').filter((id: unknown) => typeof id === 'string' && findProduct(id));
    } catch {
      // Storage unavailable or corrupt: start empty.
    }
    const likedOnly: Collection[] = [{ id: LIKED_ID, name: 'Liked items', isPrivate: true, pieces: [], itemIds: liked }];
    baseline.current = { collections: likedOnly, friends: [] };
    setCollections(likedOnly);
    setFriends([]);
    setCart([]);
    setMyReviews({});
    setUserId(DEMO_USER_ID);
    setUserName('Guest');
    setUserHandle('Not signed in');
    setUserPhoto(null);
    setNav('discover');
    setOverlay(null);
    setSession('guest');
  };
  useEffect(() => {
    if (session !== 'guest') return;
    const liked = collections.find((c) => c.id === LIKED_ID)?.itemIds ?? [];
    try {
      localStorage.setItem(GUEST_LIKED_KEY, JSON.stringify(liked));
    } catch {
      // Storage unavailable: likes just last for this visit.
    }
  }, [session, collections]);

  // Pick up a saved login on first load.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    currentUser()
      .then((user) => user && applyAccount(user))
      .finally(() => setAuthReady(true));
  }, []);

  // Load the account from Supabase once someone is in. If it isn't configured (or comes back empty) the starting data stays.
  useEffect(() => {
    if (session !== 'member') return;
    Promise.all([fetchCartItems(userId), fetchCollections(userId), fetchFriendsWithCollections(userId)])
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
    if (userId === DEMO_USER_ID) fetchAvatar(userId).then((url) => url && setUserPhoto(url));
  }, [session, userId]);

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
      if (productId && signedIn) await removeFromCart(productId, userId);
    }
    setCart((c) => c.flatMap((e) => (e.key !== key ? [e] : e.qty + delta <= 0 ? [] : [{ ...e, qty: e.qty + delta }])));
  };

  const saveReview = (itemId: string, rating: number, text: string) =>
    setMyReviews((m) => (m[itemId] ? m : {
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
      if (productId && signedIn && !(await toggleLikedItem(productId, userId))) return;
    }
    setCollections((cs) =>
      cs.map((c) =>
        c.id !== collectionId
          ? c
          : { ...c, itemIds: c.itemIds.includes(itemId) ? c.itemIds.filter((i) => i !== itemId) : [...c.itemIds, itemId] },
      ),
    );
  };
  const isLiked = (itemId: string) => collections.some((c) => c.id === LIKED_ID && c.itemIds.includes(itemId));
  const createCollection = (name: string, itemId: string, isPrivate: boolean) =>
    setCollections((cs) => [...cs, { id: `c-${Date.now()}`, name, isPrivate, pieces: [], itemIds: [itemId] }]);

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

  const openProduct = (id: string) => {
    setOpenProductId(id);
    setOverlay('product');
  };

  // Photos are saved to Supabase as a webp link. Without Supabase they just live in this session.
  const changePhoto = async (image: Blob | null) => {
    if (!image) {
      if (!(await removeAvatar(userId))) return false;
      setUserPhoto(null);
      return true;
    }
    if (!isSupabaseConfigured) {
      setUserPhoto(URL.createObjectURL(image));
      return true;
    }
    const url = await uploadAvatar(image, userId);
    if (!url) return false;
    setUserPhoto(url);
    return true;
  };

  // Guests are sent back to the login screen. Their local likes are kept.
  const goToSignIn = () => {
    setOverlay(null);
    setSession(null);
  };

  const goTo = (tab: NavTab) => {
    if (tab === 'closet') {
      setOverlay('search');
      return;
    }
    setOverlay(null);
    setNav(tab);
  };
  const handleSwipe = async (intent: SwipeIntent, id: string, variant?: Variant) => {
    const productId = findProduct(id)?.productId;
    if (productId && signedIn) {
      const persisted = await recordSwipe(productId, intent === 'reject' ? 'left' : 'right', userId, intent === 'cart');
      if (!persisted) return;
    }

    if (intent === 'like') {
      const alreadyLiked = collections.some((c) => c.id === LIKED_ID && c.itemIds.includes(id));
      if (alreadyLiked) return;
      if (productId && signedIn && !(await toggleLikedItem(productId, userId))) return;
      setCollections((cs) => cs.map((c) => (c.id === LIKED_ID && !c.itemIds.includes(id) ? { ...c, itemIds: [...c.itemIds, id] } : c)));
    }
    if (intent === 'cart') addToCart(id, variant);
  };
  const runSearch = (query: string) => {
    setFilter(query ? { query } : null);
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
    setUserHandle('@alex_cal');
    setUserPhoto(null);
    setUserId(DEMO_USER_ID);
    goTo('discover');
    setSession(null);
    signOut();
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
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            isLiked={isLiked}
            onToggleLike={(id) => toggleInCollection(LIKED_ID, id)}
          />
        );
      }
    }
    if (overlay === 'product') {
      const product = openProductId ? findProduct(openProductId) : undefined;
      if (product) {
        return (
          <ProductScreen
            key={product.id}
            nav={nav}
            onNav={goTo}
            onBack={() => setOverlay(null)}
            item={product}
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            liked={isLiked(product.id)}
            onToggleLike={() => toggleInCollection(LIKED_ID, product.id)}
            onAddToCart={(variant) => addToCart(product.id, variant)}
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
          photo={userPhoto}
          onChangePhoto={changePhoto}
          onChangeName={setUserName}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((v) => !v)}
          onLogout={handleLogout}
          guest={!signedIn}
          onSignIn={goToSignIn}
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
            productFilters={productFilters}
            onProductFilters={setProductFilters}
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            onOpenSettings={() => setOverlay('settings')}
            onSeeAll={seeAll}
            onOpenProduct={openProduct}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            guest={!signedIn}
            onSignIn={goToSignIn}
            nav={nav}
            onNav={goTo}
            collections={collections}
            onOpenCollection={openCollection}
            onCreateCollection={createEmptyCollection}
            myReviews={myReviews}
            onSaveReview={saveReview}
            name={userName}
            photo={userPhoto}
            onOpenSettings={() => setOverlay('settings')}
          />
        );
      case 'gifts':
        return <FriendsScreen
            guest={!signedIn}
            onSignIn={goToSignIn}
            nav={nav}
            onNav={goTo}
            name={userName}
            handle={userHandle}
            friends={friends}
            onSearchPeople={async (q) => {
              const rows = await searchProfiles(q, userId);
              return rows.map((r, i) => ({ id: r.id, name: r.display_name, tag: `@${r.username}`, initial: r.display_name[0] ?? '?', color: AVATAR_COLORS[i % AVATAR_COLORS.length], collections: [] }));
            }}
            onAddFriend={async (f) => {
              if (f.id && !(await addFriendship(userId, f.id))) return;
              const fresh = await fetchFriendsWithCollections(userId);
              const mapped = fresh.map(toUiFriend);
              baseline.current.friends = mapped;
              setFriends(mapped);
            }}
            onUnfriend={(tag) => {
              const gone = friends.find((f) => f.tag === tag);
              setFriends((fs) => fs.filter((f) => f.tag !== tag));
              if (gone?.id) removeFriendship(userId, gone.id);
            }}
            onAddToCart={addToCart}
            cartCount={cartCount}
            onOpenCart={() => setOverlay('cart')}
            isLiked={isLiked}
            onToggleLike={(id) => toggleInCollection(LIKED_ID, id)}
          />;
      default:
        return (
          <DiscoverScreen
            guest={!signedIn}
            onSignIn={goToSignIn}
            nav={nav}
            onNav={goTo}
            feedTab={feedTab}
            onFeedTab={setFeedTab}
            filter={filter}
            productFilters={productFilters}
            onProductFilters={setProductFilters}
            onSearch={runSearch}
            onClearFilter={() => setFilter(null)}
            collections={collections}
            onToggleCollection={toggleInCollection}
            onCreateCollection={createCollection}
            onSwipe={handleSwipe}
            cartCount={cartCount}
            lines={cartLines}
            onChangeQty={changeQty}
            appliedCode={discountCode}
            onApplyCode={setDiscountCode}
            reviews={allReviews}
          />
        );
    }
  };

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const devGo = (id: DevScreen) => {
    if (id === 'login' || id === 'signup') {
      setAuthMode(id);
      setOverlay(null);
      setSession(null);
      return;
    }
    if (!session) applyGuest();
    if (id === 'search' || id === 'settings' || id === 'cart') setOverlay(id);
    else if (id === 'product') {
      setOpenProductId(DISCOVER_ITEMS[0]?.id ?? null);
      setOverlay('product');
    } else if (id === 'collection') openCollection(collections[0]?.id ?? LIKED_ID);
    else goTo(id);
  };

  const devScreen: DevScreen = overlay ?? (nav === 'closet' ? 'search' : (nav as DevScreen));

  if (!authReady) return null;

  if (!session) {
    // Real sign-in when Supabase is configured; otherwise straight in with the demo account.
    const enter = async (error: string | null) => {
      if (error) return error;
      if (!isSupabaseConfigured) {
        setSession('member');
        return null;
      }
      const user = await currentUser();
      if (!user) return 'Couldn’t load your account. Try again.';
      applyAccount(user);
      return null;
    };
    return (
      <>
      <AuthScreen
        key={authMode}
        initialMode={authMode}
        onLogin={async (identifier, password) => enter(await signIn(identifier, password))}
        onSignUp={async (details) => {
          const error = await signUp(details);
          if (error || !isSupabaseConfigured) {
            if (!error) {
              setUserName(details.name);
              setUserHandle(`@${details.username}`);
            }
            return enter(error);
          }
          return enter(null);
        }}
        onGuest={applyGuest}
      />
      {process.env.NODE_ENV !== 'production' && <DevNav current={authMode} onGo={devGo} />}
      </>
    );
  }

  return (
    <>
      {renderScreen()}
      {process.env.NODE_ENV !== 'production' && (
        <DevNav
          current={devScreen}
          onGo={devGo}
        />
      )}
    </>
  );
}
