export interface DiscoverItem {
  id: string;
  productId: string;
  brand: string;
  title: string;
  description: string;
  price: number;
  colors?: number;
  image: string;
  alt: string;
  /** CSS object-position so the subject stays framed in the tall phone crop */
  focus: string;
}

// Mock feed until this is wired to Supabase products.
export const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: 'atelier-signature-coat',
    productId: '22222222-2222-2222-2222-222222222201',
    brand: 'ATELIER N°7',
    title: 'The Signature Wool Coat',
    description: 'Long wool-blend coat in warm oatmeal',
    price: 248,
    colors: 4,
    image:
      'https://images.unsplash.com/photo-1762605135012-56a59a059e60?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1000',
    alt: 'Woman wearing a long beige coat on stone steps',
    focus: 'center 44%',
  },
  {
    id: 'lewkin-nayela-jeans',
    productId: '22222222-2222-2222-2222-222222222205',
    brand: 'LEWKIN',
    title: 'Nayela Vintage Wide Leg Jeans',
    description: 'Washed low-rise denim with a relaxed wide leg',
    // TODO: placeholder price — replace with the real value
    price: 59,
    image: '/products/lewkin-nayela-jeans.webp',
    alt: 'Woman in a green cropped tee and washed wide leg jeans holding a cream bag',
    focus: 'center 30%',
  },
];
