export interface Purchase {
  id: string;
  itemId: string;
  /** Display date, e.g. "Oct 2, 2026" */
  purchasedOn: string;
  pricePaid: number;
}

// Mock order history until this comes from the Supabase `purchases` table.
export const PURCHASES: Purchase[] = [
  { id: 'p1', itemId: 'atelier-signature-coat', purchasedOn: 'Oct 2, 2026', pricePaid: 248 },
];
