import { supabase, isSupabaseConfigured, DEMO_USER_ID } from './client';
import { MOCK_PRODUCTS, MOCK_USER } from '../mockData';
import {
  Product,
  UserProfile,
  SwipeDirection,
  PublicProfileData,
  CheckoutResult,
  CheckinResult,
  Pin,
  Review,
  ObolTransaction,
  CartItem,
  Collection,
  FriendWithCollections,
} from '../../types/types';

/** Supabase errors print as {} in the console; spell out the useful parts. */
const why = (e: { message?: string; code?: string; details?: string; hint?: string }) => [e.code, e.message, e.details, e.hint].filter(Boolean).join(' | ');

// =========================================================
// PERSON 1 HELPERS: SWIPE DECK & CART
// =========================================================

/**
 * Fetches unswiped products for the user's card stack.
 */
export async function fetchSwipeDeck(userId: string = DEMO_USER_ID): Promise<Product[]> {
  if (!isSupabaseConfigured) return MOCK_PRODUCTS;

  // 1. Get IDs of products the user already swiped on
  const { data: swipedRows } = await supabase
    .from('swipes')
    .select('product_id')
    .eq('user_id', userId);

  const swipedIds = (swipedRows || []).map((r) => r.product_id);

  // 2. Fetch products not yet swiped (promoted items prioritized first for demo excitement)
  let query = supabase
    .from('products')
    .select('*')
    .order('is_promoted', { ascending: false })
    .order('created_at', { ascending: false });

  if (swipedIds.length > 0) {
    query = query.not('id', 'in', `(${swipedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching swipe deck:', error);
    return MOCK_PRODUCTS;
  }
  return data as Product[];
}

/**
 * Records a left or right swipe. Right swipes automatically enter the cart ('in_cart').
 */
export async function recordSwipe(
  productId: string,
  direction: SwipeDirection,
  userId: string = DEMO_USER_ID,
  addToCart = direction === 'right'
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  const { error } = await supabase.from('swipes').upsert(
    {
      user_id: userId,
      product_id: productId,
      direction,
      cart_status: addToCart ? 'in_cart' : 'passed',
    },
    { onConflict: 'user_id,product_id' }
  );

  // The cart line itself (with its size, colour and quantity) is saved by saveCartLine.
  if (error) console.error('Error recording swipe:', error);
  return !error;
}

/**
 * Fetches all right-swiped items currently sitting in the user's Cart drawer.
 */
export async function fetchCartItems(
  userId: string = DEMO_USER_ID
): Promise<(CartItem & { product: Product })[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as (CartItem & { product: Product })[];
}

/** Saves one cart line (a product in a colour and size) with its quantity. */
export async function saveCartLine(userId: string, productId: string, color: string, size: string, quantity: number): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('cart_items')
    .upsert({ user_id: userId, product_id: productId, color, size, quantity }, { onConflict: 'user_id,product_id,color,size' });
  if (error) console.error('Error saving cart item:', why(error));
  return !error;
}

/** Removes one cart line, leaving the same product in other sizes alone. */
export async function removeCartLine(userId: string, productId: string, color: string, size: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId).eq('color', color).eq('size', size);
  if (error) console.error('Error removing cart item:', why(error));
  return !error;
}

/**
 * Removes an item from the Cart drawer.
 */
export async function removeFromCart(
  productId: string,
  userId: string = DEMO_USER_ID
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  return !error;
}

export async function fetchCollections(
  userId: string = DEMO_USER_ID
): Promise<(Collection & { items: { product: Product }[] })[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('collections')
    .select('*, items:collection_items(*, product:products(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching collections:', error);
    return [];
  }
  return data as (Collection & { items: { product: Product }[] })[];
}

export async function toggleLikedItem(
  productId: string,
  userId: string = DEMO_USER_ID
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Liked items')
    .single();

  if (collectionError || !collection) {
    console.error('Error finding liked items collection:', collectionError);
    return false;
  }

  const { data: existing, error: existingError } = await supabase
    .from('collection_items')
    .select('id')
    .eq('collection_id', collection.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existingError) return false;
  const result = existing
    ? await supabase.from('collection_items').delete().eq('id', existing.id)
    : await supabase.from('collection_items').insert({ collection_id: collection.id, product_id: productId });
  return !result.error;
}

export async function fetchFriendsWithCollections(
  userId: string = DEMO_USER_ID
): Promise<FriendWithCollections[]> {
  if (!isSupabaseConfigured) return [];

  const { data: friendships, error: friendshipError } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (friendshipError || !friendships) return [];

  const friendIds = friendships.map((friendship) =>
    friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id
  );
  if (!friendIds.length) return [];

  const [{ data: profiles }, { data: collections }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', friendIds),
    supabase
      .from('collections')
      .select('*, items:collection_items(*, product:products(*))')
      .in('user_id', friendIds)
      // Likes are shared with friends (that's what the Friends feed shows); other private collections stay hidden.
      .or('is_public.eq.true,name.eq.Liked items')
      .order('created_at', { ascending: true }),
  ]);

  return (profiles || []).map((profile) => ({
    profile: profile as FriendWithCollections['profile'],
    collections: ((collections || []).filter((collection) => collection.user_id === profile.id) as FriendWithCollections['collections']),
  }));
}

/** Looks people up by @username or name (never returns the searcher). */
export async function searchProfiles(query: string, userId: string): Promise<{ id: string; display_name: string; username: string }[]> {
  if (!isSupabaseConfigured) return [];
  const q = query.trim().replace(/^@/, '').replace(/[%,()_]/g, '');
  if (!q) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .neq('id', userId)
    .or(`username.ilike.${q}%,display_name.ilike.%${q}%`)
    .limit(20);
  return error || !data ? [] : data;
}

/** Friending is instant: one accepted row, no approval. */
export async function addFriendship(userId: string, friendId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', existing.id);
    return !error;
  }
  const { error } = await supabase.from('friendships').insert({ requester_id: userId, addressee_id: friendId, status: 'accepted' });
  return !error;
}

export async function removeFriendship(userId: string, friendId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);
  return !error;
}

/**
 * 1-Click Checkout: Converts selected cart items into verified Purchases
 * AND awards Promo Brand bonus obols automatically via our SQL RPC.
 */
export async function checkoutCart(
  productIds: string[],
  userId: string = DEMO_USER_ID
): Promise<CheckoutResult> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      items_purchased: productIds.length,
      total_spent: 150,
      obols_earned: 200,
      new_obol_balance: 650,
    };
  }

  const { data, error } = await supabase.rpc('checkout_cart', {
    p_user_id: userId,
    p_product_ids: productIds,
  });

  if (error) throw error;
  return data as CheckoutResult;
}

// =========================================================
// PERSON 2 HELPERS: PROFILES, PINS & REVIEWS
// =========================================================

/**
 * Fetches full public profile payload by username (for /u/[username])
 * OR for the currently active demo user.
 */
export async function fetchPublicProfile(
  usernameOrId: string = 'alex_cal'
): Promise<PublicProfileData | null> {
  if (!isSupabaseConfigured) {
    return {
      profile: MOCK_USER,
      recent_purchases: [],
      pins: [],
      reviews: [],
    };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    usernameOrId
  );

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq(isUuid ? 'id' : 'username', usernameOrId)
    .single();

  if (error || !profile) return null;

  const [purchasesRes, pinsRes, reviewsRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('*, product:products(*)')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('purchased_at', { ascending: false }),
    supabase
      .from('pins')
      .select('*, product:products(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('*, product:products(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    profile: profile as UserProfile,
    recent_purchases: (purchasesRes.data || []) as PublicProfileData['recent_purchases'],
    pins: (pinsRes.data || []) as PublicProfileData['pins'],
    reviews: (reviewsRes.data || []) as PublicProfileData['reviews'],
  };
}

/**
 * Pins a product to a Pinterest-style board on the user's profile.
 */
export async function pinProduct(
  productId: string,
  boardName: string = 'Saved Drops',
  note: string = '',
  userId: string = DEMO_USER_ID
): Promise<Pin | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('pins')
    .upsert(
      { user_id: userId, product_id: productId, board_name: boardName, note },
      { onConflict: 'user_id,product_id' }
    )
    .select('*, product:products(*)')
    .single();

  if (error) {
    console.error('Error pinning product:', error);
    return null;
  }
  return data as Pin;
}

/**
 * Submits a verified product review (+ optional bonus obols).
 */
export async function submitReview(
  productId: string,
  rating: number,
  comment: string,
  userId: string = DEMO_USER_ID
): Promise<Review | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      product_id: productId,
      rating,
      comment,
      verified_purchase: true,
    })
    .select('*, product:products(*)')
    .single();

  if (error) {
    console.error('Error submitting review:', why(error));
    return null;
  }
  return data as Review;
}

// =========================================================
// PERSON 3 HELPERS: DAILY CHECK-IN & OBOL GAMIFICATION
// =========================================================

/**
 * Claims the user's Daily Check-In streak bonus via the PostgreSQL RPC.
 */
export async function claimDailyCheckin(
  userId: string = DEMO_USER_ID
): Promise<CheckinResult> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      already_checked_in: false,
      obols_awarded: 75,
      current_streak: 5,
      new_obol_balance: 525,
      message: 'Day 5 streak! +75 obols added.',
    };
  }

  const { data, error } = await supabase.rpc('claim_daily_checkin', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data as CheckinResult;
}

/**
 * Fetches the user's obol ledger history for the Rewards / Check-in modal.
 */
export async function fetchObolHistory(
  userId: string = DEMO_USER_ID
): Promise<ObolTransaction[]> {
  if (!isSupabaseConfigured) return [];

  const { data } = await supabase
    .from('obol_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []) as ObolTransaction[];
}

// =========================================================
// PROFILE PHOTO
// =========================================================

const AVATAR_BUCKET = 'avatars';
/** Matches the default in schema.sql, used when a photo is removed. */
const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

/**
 * Uploads an (already webp) image to the avatars bucket and saves its public URL on the profile.
 * Returns the public URL, or null if anything failed.
 */
export async function uploadAvatar(
  image: Blob,
  userId: string = DEMO_USER_ID
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const ext = image.type === 'image/webp' ? 'webp' : image.type === 'image/jpeg' ? 'jpg' : 'png';
  // A fresh path per upload so the CDN and browsers never serve a stale photo.
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, image, { contentType: image.type, cacheControl: '31536000' });
  if (uploadError) return null;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
  return error ? null : data.publicUrl;
}

/** Sets the profile photo back to the default. */
export async function removeAvatar(userId: string = DEMO_USER_ID): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const { error } = await supabase.from('profiles').update({ avatar_url: DEFAULT_AVATAR_URL }).eq('id', userId);
  return !error;
}

/** The saved profile photo URL, or null when the user hasn't uploaded one. */
export async function fetchAvatar(userId: string = DEMO_USER_ID): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
  const url = data?.avatar_url as string | undefined;
  // Only uploaded photos count; the schema default is a stock image.
  return url && url.includes(`/storage/v1/object/public/${AVATAR_BUCKET}/`) ? url : null;
}

/** Saves the profile's display name. */
export async function updateDisplayName(userId: string, name: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await supabase.from('profiles').update({ display_name: name }).eq('id', userId).select('id');
  // An update that matches no row isn't an error, so check a row actually changed.
  if (error || !data?.length) {
    console.error('Could not save display name', error ?? `no profiles row for ${userId}`);
    return false;
  }
  return true;
}

/** Saves the account's dark-mode choice. */
export async function updateDarkMode(userId: string, dark: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('profiles').update({ dark_mode: dark }).eq('id', userId);
  return !error;
}

/** Every product in the database, for the discover deck. Products are public, so guests can read them too. */
export async function fetchAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('products').select('*').order('is_promoted', { ascending: false }).order('created_at', { ascending: false });
  return error || !data ? [] : (data as Product[]);
}

/** Orders a member has placed, newest first. */
export async function fetchPurchases(userId: string): Promise<{ id: string; product_id: string; price_paid: number; purchased_at: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('purchases').select('id, product_id, price_paid, purchased_at').eq('user_id', userId).order('purchased_at', { ascending: false });
  if (error) console.error('Error loading purchases:', why(error));
  return error || !data ? [] : data;
}

/** Saves a placed order (one row per product). Returns false if the save failed. */
export async function recordPurchases(userId: string, items: { productId: string; pricePaid: number }[]): Promise<boolean> {
  if (!isSupabaseConfigured || items.length === 0) return false;
  const { error } = await supabase
    .from('purchases')
    .insert(items.map((i) => ({ user_id: userId, product_id: i.productId, price_paid: i.pricePaid, obols_earned: 0, is_public: true })));
  if (error) console.error('Error saving purchases:', why(error));
  return !error;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: { username: string } | null;
}

/** Every review, newest first, with the reviewer's @username. */
export async function fetchAllReviews(): Promise<ReviewRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, product_id, rating, comment, created_at, user:profiles(username)')
    .order('created_at', { ascending: false });
  if (error) console.error('Error loading reviews:', why(error));
  return error || !data ? [] : (data as unknown as ReviewRow[]);
}
