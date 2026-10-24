export interface DiscoverItem {
  id: string;
  brand: string;
  title: string;
  price: number;
  colors?: number;
  reviews: number;
  image: string;
  alt: string;
  /** CSS object-position so the subject stays framed in the tall phone crop */
  focus: string;
}

// Mock feed until this is wired to Supabase products.
export const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: 'atelier-signature-coat',
    brand: 'ATELIER N°7',
    title: 'The Signature Wool Coat',
    price: 248,
    colors: 4,
    reviews: 248,
    image:
      'https://images.unsplash.com/photo-1762605135012-56a59a059e60?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
    alt: 'Woman wearing a long beige coat on stone steps',
    focus: 'center 44%',
  },
  {
    id: 'lewkin-nayela-jeans',
    brand: 'LEWKIN',
    title: 'Nayela Vintage Wide Leg Jeans',
    // TODO: placeholder price/reviews — replace with real values
    price: 59,
    reviews: 112,
    image: '/products/lewkin-nayela-jeans.webp',
    alt: 'Woman in a green cropped tee and washed wide leg jeans holding a cream bag',
    focus: 'center 30%',
  },
];
