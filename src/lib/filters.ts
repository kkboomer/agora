import type { DiscoverItem } from './discoverFeed';

/**
 * Discover filters. This shape is the contract for the product query: `toQueryParams`
 * turns it into URL params, and `matchesFilters` is the client-side stand-in until the API applies them.
 */
export interface ProductFilters {
  sizes: string[];
  /** Colour families (see COLOR_FAMILIES), not individual product colour names. */
  colors: string[];
  styles: string[];
  fits: string[];
  /** Inclusive price range in dollars. `maxPrice === PRICE_RANGE.max` means no upper limit. */
  minPrice: number;
  maxPrice: number;
}

export const PRICE_RANGE = { min: 0, max: 500, step: 10 } as const;

export const EMPTY_FILTERS: ProductFilters = { sizes: [], colors: [], styles: [], fits: [], minPrice: PRICE_RANGE.min, maxPrice: PRICE_RANGE.max };

export const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '24', '26', '28', '30', '32', '34', '36', '38'];
export const STYLE_OPTIONS = ['Minimal', 'Classic', 'Vintage', 'Streetwear', 'Statement'];
export const FIT_OPTIONS = ['Slim', 'Regular', 'Relaxed', 'Oversized'];
export const COLOR_FAMILIES = [
  { name: 'Black', hex: '#1d1b18' },
  { name: 'White', hex: '#f6f3ec' },
  { name: 'Grey', hex: '#8a8782' },
  { name: 'Beige', hex: '#d3c2a5' },
  { name: 'Brown', hex: '#8a5a38' },
  { name: 'Navy', hex: '#26324f' },
  { name: 'Blue', hex: '#5f84ad' },
  { name: 'Green', hex: '#5d7a58' },
  { name: 'Red', hex: '#b8403a' },
  { name: 'Pink', hex: '#e7a3b4' },
  { name: 'Purple', hex: '#7d5a9c' },
  { name: 'Yellow', hex: '#e6c455' },
  { name: 'Orange', hex: '#d9803d' },
];

// Product colour names are free text, so map each to a family. The API should return the family directly.
const FAMILY_BY_COLOR: Record<string, string> = {
  Oatmeal: 'Beige', Stone: 'Beige', Sand: 'Beige', Camel: 'Brown',
  Charcoal: 'Grey', Graphite: 'Grey', Black: 'Black', 'Washed black': 'Black',
  Ivory: 'White', Navy: 'Navy', 'Vintage wash': 'Blue',
};
export const colorFamily = (name: string) => FAMILY_BY_COLOR[name] ?? 'Beige';

export const activeFilterCount = (f: ProductFilters) =>
  f.sizes.length + f.colors.length + f.styles.length + f.fits.length + (f.minPrice > PRICE_RANGE.min || f.maxPrice < PRICE_RANGE.max ? 1 : 0);

export function matchesFilters(item: DiscoverItem, f: ProductFilters): boolean {
  if (f.sizes.length && !item.sizes.some((s) => f.sizes.includes(s))) return false;
  if (f.colors.length && !item.colorOptions.some((c) => f.colors.includes(colorFamily(c.name)))) return false;
  if (f.styles.length && !(item.style && f.styles.includes(item.style))) return false;
  if (f.fits.length && !(item.fit && f.fits.includes(item.fit))) return false;
  if (item.price < f.minPrice) return false;
  if (f.maxPrice < PRICE_RANGE.max && item.price > f.maxPrice) return false;
  return true;
}

/** e.g. `size=S&size=M&color=Black&style=Vintage&fit=Relaxed&price_min=50&price_max=200`. Defaults are omitted. */
export function toQueryParams(f: ProductFilters): URLSearchParams {
  const p = new URLSearchParams();
  f.sizes.forEach((v) => p.append('size', v));
  f.colors.forEach((v) => p.append('color', v));
  f.styles.forEach((v) => p.append('style', v));
  f.fits.forEach((v) => p.append('fit', v));
  if (f.minPrice > PRICE_RANGE.min) p.set('price_min', String(f.minPrice));
  if (f.maxPrice < PRICE_RANGE.max) p.set('price_max', String(f.maxPrice));
  return p;
}
