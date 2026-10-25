import type { DiscoverItem } from '@/lib/discoverFeed';

/** What the Browse screen and the search bars hand to Discover. */
export interface StyleQuery {
  gender?: 'women' | 'men';
  /** A Browse category such as "Jeans" or "T-shirts". */
  category?: string;
  /** Free text from a search bar. */
  query?: string;
}

// Other words people use for the same thing, written as the tags the products carry.
const SYNONYMS: Record<string, string[]> = {
  tee: ['t-shirts'], tees: ['t-shirts'], tshirt: ['t-shirts'], tshirts: ['t-shirts'], shirt: ['shirts', 'shirts & blouses'], blouse: ['shirts & blouses'], top: ['tops'],
  pants: ['trousers', 'jeans'], trouser: ['trousers'], slacks: ['trousers'], denim: ['jeans'], jean: ['jeans'], short: ['shorts'], skirt: ['skirts'], legging: ['leggings'],
  jumper: ['sweaters'], sweater: ['sweaters'], knit: ['sweaters'], sweatshirt: ['hoodies', 'sweaters'], hoodie: ['hoodies'], tank: ['tank tops'], vest: ['vests'], gilet: ['vests'],
  jacket: ['jackets'], coat: ['coats'], trench: ['coats'], overcoat: ['coats'], blazer: ['blazers'], puffer: ['jackets', 'vests'],
  dress: ['mini', 'midi', 'maxi', 'occasion', 'dresses'], dresses: ['mini', 'midi', 'maxi', 'occasion', 'dresses'], gown: ['occasion', 'maxi'],
  shoe: ['sneakers', 'boots', 'heels', 'sandals', 'flats', 'shoes'], shoes: ['sneakers', 'boots', 'heels', 'sandals', 'flats', 'shoes'], trainers: ['sneakers'], trainer: ['sneakers'], kicks: ['sneakers'], sneaker: ['sneakers'], boot: ['boots'], heel: ['heels'], sandal: ['sandals'], flat: ['flats'],
  bag: ['bags'], purse: ['bags'], handbag: ['bags'], tote: ['bags'], backpack: ['bags'], necklace: ['jewelry'], ring: ['jewelry'], earring: ['jewelry'], earrings: ['jewelry'], bracelet: ['jewelry'], jewellery: ['jewelry'],
  hat: ['hats'], cap: ['hats'], beanie: ['hats'], belt: ['belts'], scarf: ['scarves'],
};

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
/** "jeans" and "jean" should meet in the middle. */
const stem = (w: string) => (w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

/** True when `a` and `b` are one typo apart (a swapped, missing or extra letter). */
function oneEditApart(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.slice(i) === long.slice(i + 1);
}

/** How well one query word matches one word of a product, from 0 (not at all) to 1 (exactly). */
function wordMatch(token: string, word: string) {
  if (word === token) return 1;
  if (stem(word) === stem(token)) return 0.95;
  if (token.length >= 3 && word.startsWith(token)) return 0.7;
  if (token.length >= 4 && word.includes(token)) return 0.5;
  if (token.length >= 5 && oneEditApart(stem(token), stem(word))) return 0.45;
  return 0;
}

/** How well a product matches a free-text search. 0 means it doesn't. */
export function searchScore(item: DiscoverItem, query: string): number {
  const tokens = words(query);
  if (!tokens.length) return 0;
  const tags = item.tags ?? [];
  const fields: { words: string[]; weight: number }[] = [
    { words: words(item.title), weight: 5 },
    { words: words(item.brand), weight: 4 },
    { words: tags.flatMap(words), weight: 4 },
    { words: words(item.category ?? ''), weight: 3 },
    { words: words(item.description), weight: 1 },
  ];
  let total = 0;
  for (const token of tokens) {
    // The word itself, plus anything it's a nickname for.
    const alternatives = [{ text: token, factor: 1 }, ...(SYNONYMS[token] ?? []).map((text) => ({ text, factor: 0.9 }))];
    let best = 0;
    for (const alt of alternatives) {
      const altWords = words(alt.text);
      for (const f of fields) {
        // A multi-word alternative ("shirts & blouses") must match as a whole tag.
        if (altWords.length > 1) {
          if (tags.some((t) => t.toLowerCase() === alt.text)) best = Math.max(best, f.weight * alt.factor);
          continue;
        }
        for (const w of f.words) best = Math.max(best, f.weight * alt.factor * wordMatch(altWords[0] ?? token, w));
      }
    }
    total += best;
  }
  return total;
}

/** Products in a Browse category: "Jeans" is anything tagged jeans, and gender narrows it (unisex fits both). */
function inCategory(item: DiscoverItem, category: string, gender?: 'women' | 'men') {
  const tags = (item.tags ?? []).map((t) => t.toLowerCase());
  const wanted = category.toLowerCase();
  const names = wanted === 'shirts' || wanted === 'shirts & blouses' ? ['shirts', 'shirts & blouses'] : [wanted];
  if (!names.some((n) => tags.includes(n))) return false;
  const genderTags = tags.filter((t) => t === 'women' || t === 'men' || t === 'unisex');
  return !gender || genderTags.length === 0 || genderTags.includes(gender) || genderTags.includes('unisex');
}

/** Narrows the deck to a Browse category and/or search text. Searches come back best match first. */
export function applyStyleQuery(items: DiscoverItem[], q: StyleQuery): DiscoverItem[] {
  let out = items;
  if (q.category) out = out.filter((i) => inCategory(i, q.category!, q.gender));
  if (q.query?.trim()) {
    out = out
      .map((item) => ({ item, score: searchScore(item, q.query!) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }
  return out;
}
