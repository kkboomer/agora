import fs from 'fs';

const TARGET_CATEGORIES = [
  { slug: 'mens-shirts', label: 'Apparel' },
  { slug: 'mens-shoes', label: 'Footwear' },
  { slug: 'mens-watches', label: 'Accessories' },
  { slug: 'womens-dresses', label: 'Apparel' },
  { slug: 'womens-shoes', label: 'Footwear' },
  { slug: 'womens-bags', label: 'Bags & Carry' },
  { slug: 'womens-jewellery', label: 'Accessories' },
  { slug: 'womens-watches', label: 'Accessories' },
  { slug: 'tops', label: 'Apparel' },
  { slug: 'sunglasses', label: 'Accessories' },
  { slug: 'fragrances', label: 'Lifestyle' },
  { slug: 'home-decoration', label: 'Home & Dorm' },
  { slug: 'mobile-accessories', label: 'Tech & Gear' },
];

const FALLBACK_BRANDS = ['Aether Studios', 'Kinto Living', 'Veilance Lab', 'Noir Collective', 'Studio Arket'];
const PROMO_BADGES = ['🔥 Partner Brand', '⚡ CalHacks Drop', '💎 3x Coin Multiplier', '✨ Featured Collab'];
const esc = (str) => String(str || '').replace(/'/g, "''");

async function generateSql() {
  const rawItems = [];
  for (const cat of TARGET_CATEGORIES) {
    const res = await fetch(`https://dummyjson.com/products/category/${cat.slug}?limit=20`);
    const data = await res.json();
    if (data?.products) {
      for (const item of data.products) rawItems.push({ ...item, mappedCategory: cat.label });
    }
  }

  // Duplicate/mix if DummyJSON returns 73 so we cross 85+ items
  while (rawItems.length < 85) {
    const base = rawItems[rawItems.length % 30];
    rawItems.push({ ...base, title: `${base.title} (Archive Edition)` });
  }

  const valuesSql = rawItems.map((item, idx) => {
    const isPromoted = idx % 5 === 0;
    const rawReward = Math.round((item.price * 2.5) / 25) * 25;
    const coinReward = isPromoted ? Math.max(150, Math.min(450, rawReward)) : 0;
    const promoLabel = isPromoted ? `'${esc(PROMO_BADGES[idx % PROMO_BADGES.length])} • +${coinReward} Coins'` : 'null';
    const brand = esc(item.brand?.trim() || FALLBACK_BRANDS[idx % FALLBACK_BRANDS.length]);
    const img = esc(item.images?.[0] || item.thumbnail);
    const tags = (item.tags?.length ? item.tags : [item.mappedCategory.toLowerCase(), 'drop'])
      .map((t) => `'${esc(t)}'`).join(', ');

    return `('${esc(item.title)}', '${brand}', ${Number(item.price).toFixed(2)}, '${img}', '${esc(item.mappedCategory)}', array[${tags}], '${esc(item.description)}', ${isPromoted}, ${promoLabel}, ${coinReward})`;
  }).join(',\n  ');

  const sql = `insert into public.products (title, brand_name, price, image_url, category, tags, description, is_promoted, promo_label, coin_reward)\nvalues\n  ${valuesSql};\n`;
  fs.writeFileSync('supabase/seed_catalog.sql', sql, 'utf-8');
  console.log(`✅ Generated supabase/seed_catalog.sql with ${rawItems.length} products! Copy & run it in Supabase SQL Editor.`);
}

generateSql();