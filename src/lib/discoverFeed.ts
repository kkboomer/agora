export interface ColorOption {
  name: string;
  hex: string;
}

export interface DiscoverItem {
  id: string;
  /** Supabase product id. Only set for products that exist in the database. */
  productId?: string;
  brand: string;
  title: string;
  description: string;
  price: number;
  colors?: number;
  colorOptions: ColorOption[];
  sizes: string[];
  image: string;
  alt: string;
  /** CSS object-position so the subject stays framed in the tall phone crop */
  focus: string;
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1000`;

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

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
    colorOptions: [
      { name: 'Oatmeal', hex: '#cdbba0' },
      { name: 'Charcoal', hex: '#4a4845' },
      { name: 'Camel', hex: '#b98a55' },
      { name: 'Black', hex: '#1d1b18' },
    ],
    sizes: APPAREL_SIZES,
    image: photo('1762605135012-56a59a059e60'),
    alt: 'Woman wearing a long beige coat on stone steps',
    focus: 'center 44%',
  },
  {
    id: 'lewkin-nayela-jeans',
    productId: '22222222-2222-2222-2222-222222222205',
    brand: 'LEWKIN',
    title: 'Nayela Vintage Wide Leg Jeans',
    description: 'Washed low-rise denim with a relaxed wide leg',
    // TODO: placeholder price and options — replace with the real values
    price: 59,
    colorOptions: [
      { name: 'Vintage wash', hex: '#7a93a6' },
      { name: 'Washed black', hex: '#3a3a3c' },
    ],
    sizes: ['24', '26', '28', '30', '32'],
    image: '/products/lewkin-nayela-jeans.webp',
    alt: 'Woman in a green cropped tee and washed wide leg jeans holding a cream bag',
    focus: 'center 30%',
  },
];

// Extra mock products that appear in collections (not in the Discover feed yet).
const EXTRA_ITEMS: DiscoverItem[] = [
  {
    id: 'frankie-oversized-tailoring',
    brand: 'THE FRANKIE SHOP',
    title: 'Oversized tailoring',
    description: 'Relaxed neutral blazer with matching trousers',
    price: 189,
    colorOptions: [{ name: 'Stone', hex: '#cfc5b5' }, { name: 'Black', hex: '#1d1b18' }],
    sizes: APPAREL_SIZES,
    image: photo('1613915617430-8ab0fd7c6baf'),
    alt: 'Neutral tailored blazer and trousers',
    focus: 'center 40%',
  },
  {
    id: 'nicholson-volume-jacket',
    brand: 'STUDIO NICHOLSON',
    title: 'Volume Jacket',
    description: 'Statement jacket with a sculpted, boxy shape',
    price: 215,
    colorOptions: [{ name: 'Black', hex: '#1d1b18' }, { name: 'Graphite', hex: '#55524e' }],
    sizes: APPAREL_SIZES,
    image: photo('1603189343302-e603f7add05a'),
    alt: 'Black statement jacket',
    focus: 'center 40%',
  },
  {
    id: 'everyday-trench',
    brand: 'MAYA’S PICK',
    title: 'Everyday Trench',
    description: 'Classic belted trench for every season',
    price: 168,
    colorOptions: [{ name: 'Sand', hex: '#c9b497' }, { name: 'Navy', hex: '#2b3550' }],
    sizes: APPAREL_SIZES,
    image: photo('1692180142575-c31fcd106b5b'),
    alt: 'Editorial street style look',
    focus: 'center 40%',
  },
  {
    id: 'sculpted-midi',
    brand: 'ALEX’S PICK',
    title: 'Sculpted Midi',
    description: 'Minimal midi dress with a sculpted waist',
    price: 142,
    colorOptions: [{ name: 'Ivory', hex: '#f1ede3' }, { name: 'Black', hex: '#1d1b18' }],
    sizes: ['XS', 'S', 'M', 'L'],
    image: photo('1659522761084-79196b64abe4'),
    alt: 'Minimal white dress',
    focus: 'center 40%',
  },
];

/** Every product the app knows about (the Discover feed plus items that only appear in collections). */
export const CATALOG: DiscoverItem[] = [...DISCOVER_ITEMS, ...EXTRA_ITEMS];
export const findProduct = (id: string) => CATALOG.find((i) => i.id === id);
