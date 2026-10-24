import { supabase, isSupabaseConfigured, DEMO_USER_ID } from './client';
import { MOCK_PRODUCTS, MOCK_USER } from '../mockData';
import {
  Product,
  UserProfile,
  SwipeDirection,
  SwipeRecord,
  PublicProfileData,
  CheckoutResult,
  CheckinResult,
  Pin,
  Review,
  CoinTransaction,
} from '../../types/types';

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
  userId: string = DEMO_USER_ID
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  const { error } = await supabase.from('swipes').upsert(
    {
      user_id: userId,
      product_id: productId,
      direction,
      cart_status: direction === 'right' ? 'in_cart' : 'passed',
    },
    { onConflict: 'user_id,product_id' }
  );

  if (error) console.error('Error recording swipe:', error);
  return !error;
}

/**
 * Fetches all right-swiped items currently sitting in the user's Cart drawer.
 */
export async function fetchCartItems(
  userId: string = DEMO_USER_ID
): Promise<(SwipeRecord & { product: Product })[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('swipes')
    .select('*, product:products(*)')
    .eq('user_id', userId)
    .eq('cart_status', 'in_cart')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as (SwipeRecord & { product: Product })[];
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
    .from('swipes')
    .update({ cart_status: 'removed' })
    .eq('user_id', userId)
    .eq('product_id', productId);

  return !error;
}

/**
 * 1-Click Checkout: Converts selected cart items into verified Purchases
 * AND awards Promo Brand bonus coins automatically via our SQL RPC.
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
      coins_earned: 200,
      new_coin_balance: 650,
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
 * Submits a verified product review (+ optional bonus coins).
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
    console.error('Error submitting review:', error);
    return null;
  }
  return data as Review;
}

// =========================================================
// PERSON 3 HELPERS: DAILY CHECK-IN & COIN GAMIFICATION
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
      coins_awarded: 75,
      current_streak: 5,
      new_coin_balance: 525,
      message: 'Day 5 streak! +75 coins added.',
    };
  }

  const { data, error } = await supabase.rpc('claim_daily_checkin', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data as CheckinResult;
}

/**
 * Fetches the user's coin ledger history for the Rewards / Check-in modal.
 */
export async function fetchCoinHistory(
  userId: string = DEMO_USER_ID
): Promise<CoinTransaction[]> {
  if (!isSupabaseConfigured) return [];

  const { data } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []) as CoinTransaction[];
}