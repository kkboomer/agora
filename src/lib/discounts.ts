export interface Discount {
  code: string;
  label: string;
  type: 'percent' | 'amount';
  value: number;
}

// Mock codes until discounts come from the backend.
const DISCOUNTS: Discount[] = [
  { code: 'AGORA10', label: '10% off', type: 'percent', value: 10 },
  { code: 'ALLFREE', label: '100% off', type: 'percent', value: 100 },
  { code: 'WELCOME5', label: '$5 off', type: 'amount', value: 5 },
];

export const findDiscount = (code: string) => DISCOUNTS.find((d) => d.code === code.trim().toUpperCase()) ?? null;

export const discountAmount = (d: Discount | null, subtotal: number) => {
  if (!d) return 0;
  const raw = d.type === 'percent' ? (subtotal * d.value) / 100 : d.value;
  return Math.min(Math.round(raw * 100) / 100, subtotal);
};
