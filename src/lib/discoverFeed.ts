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
  category?: string;
  tags?: string[];
  style?: string;
  fit?: string;
  image: string;
  alt: string;
  /** CSS object-position so the subject stays framed in the tall phone crop */
  focus: string;
  isPromoted?: boolean;
  promoLabel?: string | null;
  obolReward?: number;
  aiMatchScore?: number;
  aiReason?: string;
  aiSignals?: string[];
  isAiRecommended?: boolean;
}

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/** The swipe deck and the catalog are the same list, filled from the database's products. */
export const DISCOVER_ITEMS: DiscoverItem[] = [];

/** Every product the app knows about. */
export const CATALOG: DiscoverItem[] = DISCOVER_ITEMS;

export const findProduct = (id: string) => CATALOG.find((i) => i.id === id);

/** The slice of a database product the feed needs. */
export interface DbProductRow {
  id: string;
  title: string;
  brand_name: string;
  price: number;
  image_url: string;
  category: string;
  tags: string[] | null;
  description: string | null;
  obol_reward?: number | null;
  is_promoted?: boolean;
  promo_label?: string | null;
  coin_reward?: number;
  ai_match_score?: number;
  ai_reason?: string;
  ai_signals?: string[];
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
  let changed = false;
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const baseObols = Math.max(10, Math.round((Number(row.price) || 50) / 5) * 5);
    const obolReward =
      row.obol_reward ||
      row.coin_reward ||
      (row.is_promoted
        ? Math.max(150, Math.round((Number(row.price) * 2.2) / 25) * 25)
        : baseObols);
    const isPromoted = Boolean(row.is_promoted);
    const promoLabel =
      row.promo_label || (isPromoted ? `🏛️ Partner Promo • +${obolReward} Obols` : null);
    const aiMatchScore =
      row.ai_match_score ?? Math.min(98, Math.max(86, 96 - (idx % 9)));
    const aiReason =
      row.ai_reason ??
      (isPromoted
        ? `Matches your ${row.category} vibe • +${obolReward} Partner Obols`
        : `Picked for your interest in ${row.tags?.[0] || row.category} & ${row.brand_name}`);
    const aiSignals = row.ai_signals ?? [
      `Style affinity: ${row.category} (${row.tags?.[0] || 'essentials'})`,
      isPromoted
        ? `Partner Brand Obol Multiplier (+${obolReward} Obols)`
        : `Brand cluster: ${row.brand_name}`,
      'Zero personal payment or PII data used',
    ];

    const existing = CATALOG.find((item) => item.productId === row.id);
    if (existing) {
      existing.category = row.category;
      existing.tags = row.tags ?? [];
      existing.isPromoted = isPromoted;
      existing.promoLabel = promoLabel;
      existing.obolReward = obolReward;
      existing.aiMatchScore = row.ai_match_score ?? existing.aiMatchScore ?? aiMatchScore;
      existing.aiReason = row.ai_reason ?? existing.aiReason ?? aiReason;
      existing.aiSignals = row.ai_signals ?? existing.aiSignals ?? aiSignals;
      existing.isAiRecommended = true;
      continue;
    }

    CATALOG.push({
      id: `db-${row.id}`,
      productId: row.id,
      brand: row.brand_name,
      title: row.title,
      description: row.description ?? row.category,
      price: Number(row.price),
      colorOptions: [],
      sizes: SIZES_BY_CATEGORY[row.category] ?? [],
      category: row.category,
      tags: row.tags ?? [],
      style: row.tags?.[0],
      image: row.image_url,
      alt: row.title,
      focus: 'center',
      isPromoted,
      promoLabel,
      obolReward,
      aiMatchScore,
      aiReason,
      aiSignals,
      isAiRecommended: true,
    });
    changed = true;
  }
  return changed;
}

/** Boosts products aligned with the user's latest positive in-session signal. */
export function adaptFeedOnRightSwipe(likedItem: DiscoverItem): void {
  for (const item of CATALOG) {
    if (item.id === likedItem.id) continue;

    let boost = 0;
    if (item.brand === likedItem.brand) {
      boost = 5;
      item.aiReason = `Because you just liked ${likedItem.brand}`;
      item.aiSignals = [
        `In-session right swipe on ${likedItem.brand} ${likedItem.title}`,
        `Matched brand aesthetic: ${likedItem.brand}`,
        'Real-time session learning (Zero PII stored)',
      ];
    } else if (item.style && item.style === likedItem.style) {
      boost = 3;
      item.aiReason = `Matches the ${likedItem.style} style you just liked`;
      item.aiSignals = [
        `Liked ${likedItem.title} (${likedItem.style})`,
        `Category affinity boost: ${item.category || item.style}`,
        'Real-time session learning (Zero PII stored)',
      ];
    } else if (item.category && item.category === likedItem.category) {
      boost = 2;
      item.aiReason = `Matches the ${item.category} style you just liked`;
      item.aiSignals = [
        `Liked ${likedItem.title} (${item.category})`,
        `Category affinity boost: ${item.category}`,
        'Real-time session learning (Zero PII stored)',
      ];
    }

    if (boost > 0) {
      item.aiMatchScore = Math.min(99, (item.aiMatchScore ?? 88) + boost);
      item.isAiRecommended = true;
    }
  }
}
