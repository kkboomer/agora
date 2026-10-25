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
  /** Filterable attributes (see lib/filters.ts). */
  style?: string;
  fit?: string;
  image: string;
  alt: string;
  /** CSS object-position so the subject stays framed in the tall phone crop */
  focus: string;
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1000`;

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

// Mock feed until this is wired to Supabase products.
const FEATURED_ITEMS: DiscoverItem[] = [
  {
    id: 'atelier-signature-coat',
    style: 'Classic',
    fit: 'Relaxed',
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
    style: 'Vintage',
    fit: 'Relaxed',
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

// More mock products. They follow the featured pair in the Discover feed.
const EXTRA_ITEMS: DiscoverItem[] = [
  {
    id: 'frankie-oversized-tailoring',
    style: 'Minimal',
    fit: 'Oversized',
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
    style: 'Statement',
    fit: 'Oversized',
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
    style: 'Classic',
    fit: 'Regular',
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
    style: 'Minimal',
    fit: 'Slim',
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

const byId = (id: string) => EXTRA_ITEMS.find((i) => i.id === id)!;

/** The swipe deck: the featured pair, then the jacket, tailoring, trench and midi. */
export const DISCOVER_ITEMS: DiscoverItem[] = [
  ...FEATURED_ITEMS,
  byId('nicholson-volume-jacket'),
  byId('frankie-oversized-tailoring'),
  byId('everyday-trench'),
  byId('sculpted-midi'),
];

/** Every product the app knows about. */
export const CATALOG: DiscoverItem[] = DISCOVER_ITEMS;

/** The slice of a database product the feed needs. */
interface DbProductRow {
  id: string;
  title: string;
  brand_name: string;
  price: number;
  image_url: string;
  category: string;
  tags: string[] | null;
  description: string | null;
}

const SIZES_BY_CATEGORY: Record<string, string[]> = {
  Apparel: APPAREL_SIZES,
  Footwear: ['7', '8', '9', '10', '11'],
};

/**
 * Adds database products the feed doesn't already show, so the deck covers everything that's seeded.
 * Returns true when something new was added (so screens know to re-read the deck).
 */
export function addDbProducts(rows: DbProductRow[]): boolean {
  let added = false;
  for (const row of rows) {
    if (CATALOG.some((i) => i.productId === row.id)) continue;
    CATALOG.push({
      id: `db-${row.id}`,
      productId: row.id,
      brand: row.brand_name,
      title: row.title,
      description: row.description ?? row.category,
      price: Number(row.price),
      colorOptions: [],
      sizes: SIZES_BY_CATEGORY[row.category] ?? [],
      style: row.tags?.[0],
      image: row.image_url,
      alt: row.title,
      focus: 'center',
    });
    added = true;
  }
  return added;
}
export const findProduct = (id: string) => CATALOG.find((i) => i.id === id);
