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

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/** The swipe deck and the catalog are the same list, filled from the database's products. */
export const DISCOVER_ITEMS: DiscoverItem[] = [];

/** Every product the app knows about. */
export const CATALOG: DiscoverItem[] = DISCOVER_ITEMS;
export const findProduct = (id: string) => CATALOG.find((i) => i.id === id);

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
  Tops: APPAREL_SIZES,
  Outerwear: APPAREL_SIZES,
  Bottoms: APPAREL_SIZES,
  Dresses: APPAREL_SIZES,
  Shoes: ['7', '8', '9', '10', '11'],
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
