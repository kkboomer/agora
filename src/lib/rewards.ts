export interface Reward {
  id: string;
  title: string;
  blurb: string;
  /** Obols it costs to claim. */
  cost: number;
  /** The discount code a claim unlocks (defined in lib/discounts.ts). */
  code: string;
}

/** What obols can be spent on. Each claim unlocks a one-time discount code for the cart. */
export const REWARDS: Reward[] = [
  { id: 'ten-off', title: '10% off your order', blurb: 'Take 10% off everything in your cart.', cost: 250, code: 'REWARD10' },
  { id: 'fifteen-item', title: '15% off any one item', blurb: 'Pick your favourite piece and take 15% off it.', cost: 500, code: 'REWARD15' },
  { id: 'twenty-off', title: '$20 off an order', blurb: 'A flat $20 off, on any order.', cost: 750, code: 'REWARD20' },
  { id: 'free-item', title: 'A free item', blurb: 'Any one item up to $50, on us.', cost: 1000, code: 'FREEITEM' },
];

export const rewardForCode = (code: string) => REWARDS.find((r) => r.code === code);

/** One gift between friends, from the signed-in user's point of view. */
export interface GiftEntry {
  id: string;
  direction: 'sent' | 'received';
  /** The other person. */
  name: string;
  amount: number;
  brand: string | null;
  when: string;
}
