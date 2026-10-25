export interface Discount {
  code: string;
  label: string;
  type: 'percent' | 'amount';
  value: number;
  /** 'one-item' applies to the single priciest item instead of the whole cart. */
  scope?: 'one-item';
  /** The most this can take off. */
  cap?: number;
}

// Mock codes until discounts come from the backend.
const DISCOUNTS: Discount[] = [
  { code: 'AGORA10', label: '10% off', type: 'percent', value: 10 },
  { code: 'ALLFREE', label: '100% off', type: 'percent', value: 100 },
  { code: 'WELCOME5', label: '$5 off', type: 'amount', value: 5 },
];

// Reward codes only work once they're claimed with obols (see lib/rewards.ts).
const REWARD_DISCOUNTS: Discount[] = [
  { code: 'REWARD10', label: '10% off your order', type: 'percent', value: 10 },
  { code: 'REWARD15', label: '15% off one item', type: 'percent', value: 15, scope: 'one-item' },
  { code: 'REWARD20', label: '$20 off', type: 'amount', value: 20 },
  { code: 'FREEITEM', label: 'Free item (up to $50)', type: 'percent', value: 100, scope: 'one-item', cap: 50 },
];
let unlocked = new Set<string>();
/** The reward codes the signed-in user has claimed and not used yet. */
export const setUnlockedCodes = (codes: string[]) => {
  unlocked = new Set(codes);
};
export const isRewardCode = (code: string) => REWARD_DISCOUNTS.some((d) => d.code === code);

export const findDiscount = (code: string) => {
  const c = code.trim().toUpperCase();
  return DISCOUNTS.find((d) => d.code === c) ?? (unlocked.has(c) ? REWARD_DISCOUNTS.find((d) => d.code === c) : undefined) ?? null;
};

/** `priciest` is the price of the most expensive single item, which one-item discounts apply to. */
export const discountAmount = (d: Discount | null, subtotal: number, priciest = subtotal) => {
  if (!d) return 0;
  const base = d.scope === 'one-item' ? priciest : subtotal;
  let raw = d.type === 'percent' ? (base * d.value) / 100 : d.value;
  if (d.cap !== undefined) raw = Math.min(raw, d.cap);
  return Math.min(Math.round(raw * 100) / 100, subtotal);
};
