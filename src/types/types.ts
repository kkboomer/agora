// ==========================================
// 1. CORE ENTITIES (Matches Supabase Tables)
// ==========================================

export type SwipeDirection = 'left' | 'right';
export type CartStatus = 'passed' | 'in_cart' | 'purchased' | 'removed';
export type ObolReason = 'daily_checkin' | 'promo_purchase' | 'review_bonus' | 'redemption';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  obol_balance: number;
  checkin_streak: number;
  last_checkin_date: string | null; // ISO Date string (YYYY-MM-DD)
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  brand_name: string;
  brand_logo_url: string | null;
  price: number;
  image_url: string;
  category: string;
  tags: string[];
  description: string;
  // Gamification / Brand Promo fields
  is_promoted: boolean;
  promo_label: string | null;       // e.g., "Fall Drop • 3x Obols"
  obol_reward: number;              // Base obols earned when purchased (0 if not promoted, or e.g. 150)
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity?: number;
  color?: string;
  size?: string;
  created_at: string;
  product?: Product;
}

export interface FriendCollection extends Collection {
  items: (CollectionItem & { product: Product })[];
}

export interface FriendWithCollections {
  profile: UserProfile;
  collections: FriendCollection[];
}

export interface SwipeRecord {
  id: string;
  user_id: string;
  product_id: string;
  direction: SwipeDirection;
  cart_status: CartStatus;
  created_at: string;
  // Joined relation when querying cart
  product?: Product;
}

export interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  price_paid: number;
  obols_earned: number;
  is_public: boolean;               // Controls whether it shows on /u/[username]
  purchased_at: string;
  // Joined relation for Profile "Recent Purchases" tab
  product?: Product;
}

export interface Pin {
  id: string;
  user_id: string;
  product_id: string;
  board_name: string;               // e.g., "Streetwear Inspo", "Dorm Setup"
  note: string | null;              // Optional Pinterest-style caption
  created_at: string;
  // Joined relation for Profile "Pins" masonry grid
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;                   // 1 to 5 stars
  comment: string;
  review_image_url: string | null;  // Optional user-uploaded fit pic / photo
  verified_purchase: boolean;
  created_at: string;
  // Joined relations for Profile & Product cards
  product?: Product;
  user?: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface ObolTransaction {
  id: string;
  user_id: string;
  amount: number;                   // Positive for rewards, negative for redemptions
  reason: ObolReason;
  description: string;              // e.g., "Purchased Nike Promo Item (+200 obols)"
  created_at: string;
}

// ==========================================
// 2. COMPOSITE PAYLOADS (For UI Components)
// ==========================================

/**
 * Payload returned for Person 2's Shareable Profile page (/u/[username])
 */
export interface PublicProfileData {
  profile: UserProfile;
  recent_purchases: (Purchase & { product: Product })[];
  pins: (Pin & { product: Product })[];
  reviews: (Review & { product: Product })[];
}

/**
 * Response from Person 3's 1-Click Checkout RPC (`checkout_cart`)
 */
export interface CheckoutResult {
  success: boolean;
  items_purchased: number;
  total_spent: number;
  obols_earned: number;
  new_obol_balance: number;
}

/**
 * Response from Person 3's Daily Check-In RPC (`claim_daily_checkin`)
 */
export interface CheckinResult {
  success: boolean;
  already_checked_in: boolean;
  obols_awarded: number;
  current_streak: number;
  new_obol_balance: number;
  message: string;
}
