import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Parse .env.local automatically
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  }
}

// 2. Curated Blueprint covering ALL 6 Groups & 24 Subcategories
// Guaranteed high-res fashion imagery (Zero tech, fragrances, or home decor)
const CURATED_FASHION_BLUEPRINTS = [
  // ==================== TOPS ====================
  { title: 'Heavyweight Boxy Crewneck T-Shirt', brand: 'Aether Studios', price: 38, category: 'Tops', sub: 'T-shirts', gender: 'unisex', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', desc: '300GSM organic combed cotton tee with a relaxed boxy drape.' },
  { title: 'Vintage Washed Graphic Tee', brand: 'Noir Collective', price: 42, category: 'Tops', sub: 'T-shirts', gender: 'unisex', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800', desc: 'Sun-faded charcoal jersey tee with distressed screenprint.' },
  { title: 'Essential Ribbed Baby Tee', brand: 'Studio Arket', price: 32, category: 'Tops', sub: 'T-shirts', gender: 'women', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800', desc: 'Soft micro-ribbed cropped t-shirt in off-white.' },
  { title: 'Relaxed Oxford Button-Down Shirt', brand: 'Ralph Lauren', price: 98, category: 'Tops', sub: 'Shirts', gender: 'men', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', desc: 'Classic garment-dyed cotton Oxford shirt for layered everyday wear.' },
  { title: 'Satin Draped Tie-Neck Blouse', brand: 'Reformation', price: 118, category: 'Tops', sub: 'Shirts & blouses', gender: 'women', img: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=800', desc: 'Fluid silk-touch blouse with pearl buttons and relaxed cuffs.' },
  { title: 'Linen Camp Collar Short-Sleeve Shirt', brand: 'Corridor NYC', price: 110, category: 'Tops', sub: 'Shirts', gender: 'men', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', desc: 'Breathable open-weave linen shirt with mother-of-pearl buttons.' },
  { title: 'Chunky Fisherman Cable-Knit Sweater', brand: 'A.P.C.', price: 165, category: 'Tops', sub: 'Sweaters', gender: 'unisex', img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800', desc: '100% merino wool cable-knit crew sweater in oatmeal heather.' },
  { title: 'Brushed Mohair Oversized Cardigan Sweater', brand: 'Acne Studios', price: 210, category: 'Tops', sub: 'Sweaters', gender: 'unisex', img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800', desc: 'Soft brushed alpaca-mohair blend knit with dropped shoulders.' },
  { title: '500GSM Washed Charcoal Boxy Hoodie', brand: 'Aether Studios', price: 88, category: 'Tops', sub: 'Hoodies', gender: 'unisex', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', desc: 'Ultra-heavyweight French terry hoodie with double-lined hood and no drawstring.' },
  { title: 'Vintage Fleece Zip-Up Hoodie', brand: 'Stüssy', price: 120, category: 'Tops', sub: 'Hoodies', gender: 'unisex', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800', desc: 'Garment-washed ash grey zip hoodie with two-way metal zipper.' },
  { title: 'High-Neck Ribbed Cotton Tank Top', brand: 'Skims', price: 36, category: 'Tops', sub: 'Tank tops', gender: 'women', img: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800', desc: 'Form-fitting stretch cotton rib racerback tank top.' },
  { title: 'Heavy Waffle-Knit Layering Tank Top', brand: 'Our Legacy', price: 54, category: 'Tops', sub: 'Tank tops', gender: 'men', img: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800', desc: 'Textured thermal waffle tank designed for standalone or open-shirt layering.' },

  // ==================== OUTERWEAR ====================
  { title: 'Detroit Washed Canvas Work Jacket', brand: 'Carhartt WIP', price: 198, category: 'Outerwear', sub: 'Jackets', gender: 'unisex', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', desc: '12oz organic Dearborn canvas jacket with corduroy collar and blanket lining.' },
  { title: 'Vintage Distressed Leather Moto Jacket', brand: 'AllSaints', price: 340, category: 'Outerwear', sub: 'Jackets', gender: 'unisex', img: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800', desc: 'Supple full-grain lambskin biker jacket with asymmetric zip hardware.' },
  { title: 'Gore-Tex Alpine Hardshell Jacket', brand: 'Arc\'teryx', price: 295, category: 'Outerwear', sub: 'Jackets', gender: 'unisex', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800', desc: 'Waterproof, windproof breathable technical shell for wet campus commutes.' },
  { title: 'Double-Breasted Wool Trench Coat', brand: 'COS', price: 250, category: 'Outerwear', sub: 'Coats', gender: 'unisex', img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800', desc: 'Tailored longline belted overcoat in recycled Italian wool blend.' },
  { title: 'Water-Repellent Gabardine Mac Coat', brand: 'Mackintosh', price: 230, category: 'Outerwear', sub: 'Coats', gender: 'unisex', img: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800', desc: 'Minimalist single-breasted storm coat with concealed placket.' },
  { title: 'Oversized Structured Wool Blazer', brand: 'Frankie Shop', price: 185, category: 'Outerwear', sub: 'Blazers', gender: 'women', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', desc: 'Menswear-inspired relaxed suiting blazer with padded shoulders.' },
  { title: 'Unstructured Linen-Hopsack Blazer', brand: 'Theory', price: 215, category: 'Outerwear', sub: 'Blazers', gender: 'men', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', desc: 'Lightweight breathable tailored jacket with patch pockets.' },
  { title: '700-Fill Ripstop Down Puffer Vest', brand: 'The North Face', price: 160, category: 'Outerwear', sub: 'Vests', gender: 'unisex', img: 'https://images.unsplash.com/photo-1608063615781-e2ef8c73d114?w=800', desc: 'Packable water-resistant insulated gilet with stand collar.' },
  { title: 'Fleece Utility Tactical Vest', brand: 'Snow Peak', price: 135, category: 'Outerwear', sub: 'Vests', gender: 'unisex', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', desc: 'Polartec thermal fleece layering vest with zippered chest pockets.' },

  // ==================== BOTTOMS ====================
  { title: '501 Original Fit Selvedge Jeans', brand: 'Levi\'s Vintage', price: 128, category: 'Bottoms', sub: 'Jeans', gender: 'unisex', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', desc: '14oz raw indigo redline selvedge denim with straight leg.' },
  { title: 'Baggy Wide-Leg Skater Jeans', brand: 'Polar Skate Co.', price: 115, category: 'Bottoms', sub: 'Jeans', gender: 'unisex', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', desc: '90s-inspired loose fit washed black denim with custom embroidered pocket.' },
  { title: 'High-Rise Pleated Wide-Leg Trousers', brand: 'Aritzia', price: 148, category: 'Bottoms', sub: 'Trousers', gender: 'women', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800', desc: 'Tailored drape suiting pants in espresso brown with front pleats.' },
  { title: 'Relaxed Tapered Chino Trousers', brand: 'Norse Projects', price: 135, category: 'Bottoms', sub: 'Trousers', gender: 'men', img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', desc: 'Heavy organic cotton twill trousers with tonal corozo buttons.' },
  { title: '5-Inch Baggies Nylon Trail Shorts', brand: 'Patagonia', price: 65, category: 'Bottoms', sub: 'Shorts', gender: 'unisex', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800', desc: 'Quick-drying recycled nylon shorts with elasticated drawstring waist.' },
  { title: 'Heavyweight Sweat Shorts', brand: 'Fear of God Essentials', price: 75, category: 'Bottoms', sub: 'Shorts', gender: 'unisex', img: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800', desc: 'Core fleece relaxed shorts with elongated drawstring and side seam pockets.' },
  { title: 'Pleated Micro-Mini Tennis Skirt', brand: 'Alo Yoga', price: 68, category: 'Bottoms', sub: 'Skirts', gender: 'women', img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800', desc: 'High-waisted pleated court skirt with built-in inner shorts.' },
  { title: 'Bias-Cut Silk Satin Midi Skirt', brand: 'Realisation Par', price: 140, category: 'Bottoms', sub: 'Skirts', gender: 'women', img: 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=800', desc: 'Fluid 100% silk slip skirt cut on the bias for effortless movement.' },
  { title: 'Align High-Rise Flared Leggings', brand: 'Lululemon', price: 98, category: 'Bottoms', sub: 'Leggings', gender: 'women', img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', desc: 'Weightless buttery-soft Nulu fabric leggings for studio or lounging.' },
  { title: 'Seamless Sculpt Compression Leggings', brand: 'Set Active', price: 72, category: 'Bottoms', sub: 'Leggings', gender: 'women', img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800', desc: 'High-compression ribbed activewear leggings with no front seam.' },

  // ==================== DRESSES (WOMEN ONLY) ====================
  { title: 'Linen Square-Neck A-Line Mini Dress', brand: 'Reformation', price: 148, category: 'Dresses', sub: 'Mini', gender: 'women', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', desc: 'Fitted bodice mini dress with smocked back panel in breathable linen.' },
  { title: 'Corset Bodice Poplin Mini Dress', brand: 'House of CB', price: 175, category: 'Dresses', sub: 'Mini', gender: 'women', img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800', desc: 'Structured boned bodice with voluminous flared cotton poplin skirt.' },
  { title: 'Ribbed Knit Open-Back Midi Dress', brand: 'Cult Gaia', price: 195, category: 'Dresses', sub: 'Midi', gender: 'women', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', desc: 'Contoured mid-calf sweater dress with cutout hardware detail.' },
  { title: 'Floral Crêpe Tiered Midi Dress', brand: 'Ganni', price: 165, category: 'Dresses', sub: 'Midi', gender: 'women', img: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800', desc: 'Relaxed silhouette midi dress with puff sleeves in botanical print.' },
  { title: 'Halter-Neck Tiered Chiffon Maxi Dress', brand: 'Zimmermann', price: 240, category: 'Dresses', sub: 'Maxi', gender: 'women', img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', desc: 'Floor-sweeping lightweight resort maxi dress with braided waist tie.' },
  { title: 'Backless Cowl-Neck Silk Occasion Gown', brand: 'Bec + Bridge', price: 280, category: 'Dresses', sub: 'Occasion', gender: 'women', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', desc: 'Liquid-shine emerald satin evening dress for formal events and galas.' },

  // ==================== SHOES ====================
  { title: 'Gel-Kayano 14 Metallic Retro Sneakers', brand: 'ASICS SportStyle', price: 150, category: 'Shoes', sub: 'Sneakers', gender: 'unisex', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', desc: 'Late-2000s technical runner aesthetic with GEL cushioning and silver overlays.' },
  { title: 'Samba OG Gum-Sole Leather Sneakers', brand: 'Adidas Originals', price: 100, category: 'Shoes', sub: 'Sneakers', gender: 'unisex', img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800', desc: 'Iconic low-profile indoor pitch trainer in supple leather and suede T-toe.' },
  { title: '1460 Smooth Leather Lace-Up Boots', brand: 'Dr. Martens', price: 170, category: 'Shoes', sub: 'Boots', gender: 'unisex', img: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800', desc: '8-eye combat boot with Goodyear-welted air-cushioned sole and yellow stitching.' },
  { title: 'Square-Toe Chelsea Ankle Boots', brand: 'Vagabond Shoemakers', price: 185, category: 'Shoes', sub: 'Boots', gender: 'unisex', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', desc: 'Architectural block-heel leather Chelsea boots with elastic side panels.' },
  { title: 'Slingback Patent Leather Kitten Heels', brand: 'Miu Miu', price: 245, category: 'Shoes', sub: 'Heels', gender: 'women', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', desc: 'Pointed-toe burgundy patent heels with buckle strap detail.' },
  { title: 'Strappy Sculpted Stiletto Heels', brand: 'Amina Muaddi', price: 260, category: 'Shoes', sub: 'Heels', gender: 'women', img: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800', desc: 'Flared martini heel evening sandals with crystal-embellished straps.' },
  { title: 'Arizona Oiled Leather Footbed Sandals', brand: 'Birkenstock', price: 140, category: 'Shoes', sub: 'Sandals', gender: 'unisex', img: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800', desc: 'Contoured cork-latex footbed two-strap sandals in tobacco brown suede.' },
  { title: 'Square-Toe Leather Mary Jane Flats', brand: 'Repetto Paris', price: 155, category: 'Shoes', sub: 'Flats', gender: 'women', img: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800', desc: 'Supple nappa leather ballet flats with instep strap and delicate bow.' },

  // ==================== ACCESSORIES ====================
  { title: 'Woven Leather Intrecciato Shoulder Bag', brand: 'Bottega Archive', price: 275, category: 'Accessories', sub: 'Bags', gender: 'women', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', desc: 'Hand-braided supple calfskin hobo bag with knotted strap.' },
  { title: 'Ripstop Waterproof Crossbody Sling Bag', brand: 'Arc\'teryx Veilance', price: 95, category: 'Accessories', sub: 'Bags', gender: 'unisex', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', desc: 'Weatherproof taped-seam everyday commuter bag with quick-release buckle.' },
  { title: '18k Gold Vermeil Chunky Dome Hoops', brand: 'Mejuri', price: 78, category: 'Accessories', sub: 'Jewelry', gender: 'women', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', desc: 'Lightweight hollow recycled sterling silver hoops plated in thick 18k gold.' },
  { title: '925 Sterling Silver Cuban Curb Chain', brand: 'Vitaly Design', price: 85, category: 'Accessories', sub: 'Jewelry', gender: 'unisex', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', desc: 'Heavy-gauge tarnished silver chain necklace with custom carabiner clasp.' },
  { title: 'Washed Cotton Twill Dad Hat', brand: 'Aimé Leon Dore', price: 55, category: 'Accessories', sub: 'Hats', gender: 'unisex', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800', desc: 'Unstructured 6-panel forest green cap with chain-stitched chain embroidery.' },
  { title: 'Merino Wool Fisherman Beanie Hat', brand: 'Norse Projects', price: 60, category: 'Accessories', sub: 'Hats', gender: 'unisex', img: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800', desc: 'Rib-knitted cuff beanie crafted from 100% RWS extra-fine merino wool.' },
  { title: 'Full-Grain Italian Leather Western Belt', brand: 'Our Legacy', price: 115, category: 'Accessories', sub: 'Belts', gender: 'unisex', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800', desc: '2cm black bridle leather belt with antiqued nickel tip and buckle.' },
  { title: 'Fringed Checked Alpaca Wool Scarf', brand: 'Acne Studios', price: 190, category: 'Accessories', sub: 'Scarves', gender: 'unisex', img: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800', desc: 'Oversized cozy plaid blanket scarf woven from soft alpaca and mohair.' },
];

// 3. STRICT Fashion-Only DummyJSON endpoints (NO fragrances, home-decoration, or mobile-accessories)
const DUMMYJSON_FASHION_MAP = [
  { slug: 'tops', category: 'Tops', sub: 'T-shirts', gender: 'women' },
  { slug: 'mens-shirts', category: 'Tops', sub: 'Shirts', gender: 'men' },
  { slug: 'womens-dresses', category: 'Dresses', sub: 'Midi', gender: 'women' },
  { slug: 'mens-shoes', category: 'Shoes', sub: 'Sneakers', gender: 'men' },
  { slug: 'womens-shoes', category: 'Shoes', sub: 'Heels', gender: 'women' },
  { slug: 'womens-bags', category: 'Accessories', sub: 'Bags', gender: 'women' },
  { slug: 'womens-jewellery', category: 'Accessories', sub: 'Jewelry', gender: 'women' },
];

const PROMO_BADGES = [
  '🏛️ Partner Brand',
  '⚡ Agora Exclusive',
  '🔥 3x Obol Multiplier',
  '✨ Featured Drop',
];

const esc = (str) => String(str || '').replace(/'/g, "''");

async function buildAndSeedCatalog() {
  console.log('🏛️ Building strictly Fashion, Footwear & Accessories catalog...');

  const combinedItems = [...CURATED_FASHION_BLUEPRINTS];

  // Fetch ~35 additional strict fashion items from DummyJSON
  for (const map of DUMMYJSON_FASHION_MAP) {
    try {
      const res = await fetch(`https://dummyjson.com/products/category/${map.slug}?limit=10`);
      const data = await res.json();
      if (data?.products) {
        for (const item of data.products) {
          combinedItems.push({
            title: item.title,
            brand: item.brand?.trim() || 'Studio Arket',
            price: item.price,
            category: map.category,
            sub: map.sub,
            gender: map.gender,
            img: item.images?.[0] || item.thumbnail,
            desc: item.description,
          });
        }
      }
    } catch (e) {
      console.warn(`⚠️ Skipped external fetch for ${map.slug}, using curated blueprints.`);
    }
  }

  // Ensure we hit 85+ items by generating Archive colorway editions from our curated outerwear/bottoms/accessories
  const COLORWAYS = ['Obsidian Black', 'Washed Sage', 'Bone White', 'Espresso', 'Heather Grey'];
  let idxCounter = 0;
  while (combinedItems.length < 88) {
    const base = CURATED_FASHION_BLUEPRINTS[idxCounter % CURATED_FASHION_BLUEPRINTS.length];
    const color = COLORWAYS[idxCounter % COLORWAYS.length];
    combinedItems.push({
      ...base,
      title: `${base.title} — ${color}`,
      price: Math.round(base.price * 1.05),
    });
    idxCounter++;
  }

  // Shuffle so the swipe deck mixes Tops, Outerwear, Bottoms, Dresses, Shoes, and Accessories naturally
  const shuffled = combinedItems.sort(() => Math.random() - 0.5);

  const finalProducts = shuffled.map((item, idx) => {
    // Flag exactly 20% (1 in 5) as is_promoted = true
    const isPromoted = idx % 5 === 0;
    const rawReward = Math.round((item.price * 2.2) / 25) * 25;
    const obolReward = isPromoted ? Math.max(150, Math.min(450, rawReward)) : 0;
    const badge = PROMO_BADGES[idx % PROMO_BADGES.length];
    const promoLabel = isPromoted ? `${badge} • +${obolReward} Obols` : null;

    // Tags include exact subcategory + gender so frontend filters work out of the box
    const tags = [
      item.sub.toLowerCase(),
      item.category.toLowerCase(),
      item.gender,
    ];

    return {
      title: item.title,
      brand_name: item.brand,
      brand_logo_url: null,
      price: Number(Number(item.price).toFixed(2)),
      image_url: item.img,
      category: item.category, // Strictly one of: Tops, Outerwear, Bottoms, Dresses, Shoes, Accessories
      tags,
      description: item.desc,
      is_promoted: isPromoted,
      promo_label: promoLabel,
      obol_reward: obolReward,
    };
  });

  // 4. Write supabase/seed_catalog.sql (Starts with TRUNCATE to wipe out old tech/home items!)
  const valuesSql = finalProducts
    .map((p) => {
      const promoSql = p.promo_label ? `'${esc(p.promo_label)}'` : 'null';
      const tagsSql = p.tags.map((t) => `'${esc(t)}'`).join(', ');
      return `('${esc(p.title)}', '${esc(p.brand_name)}', ${p.price.toFixed(2)}, '${esc(p.image_url)}', '${esc(p.category)}', array[${tagsSql}], '${esc(p.description)}', ${p.is_promoted}, ${promoSql}, ${p.obol_reward})`;
    })
    .join(',\n  ');

  const fullSql = `-- =========================================================
-- AGORA FASHION-ONLY CATALOG SEED (Tops, Outerwear, Bottoms, Dresses, Shoes, Accessories)
-- =========================================================

-- 1. Wipe old tech/home/fragrance products (cascades cleanly)
truncate table public.products cascade;

-- 2. Insert ${finalProducts.length} fashion & accessory items (20% Promoted with Obol rewards)
insert into public.products (
  title, brand_name, price, image_url, category, tags, description, is_promoted, promo_label, obol_reward
)
values
  ${valuesSql};
`;

  fs.mkdirSync('supabase', { recursive: true });
  fs.writeFileSync('supabase/seed_catalog.sql', fullSql, 'utf-8');

  const promotedCount = finalProducts.filter((p) => p.is_promoted).length;
  console.log(
    `✅ Generated supabase/seed_catalog.sql with ${finalProducts.length} fashion items (${promotedCount} promoted = ${((promotedCount / finalProducts.length) * 100).toFixed(1)}%).`
  );

  // 5. Also try direct Supabase insert if a valid JWT key is in .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey && supabaseKey.startsWith('eyJ')) {
    console.log('🔄 Detected valid JWT key in .env.local — syncing directly to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('products').insert(finalProducts);
    if (error) {
      console.warn('⚠️ Direct insert skipped (paste supabase/seed_catalog.sql into SQL Editor instead):', error.message);
    } else {
      console.log('🚀 Directly replaced all products in Supabase database!');
    }
  } else {
    console.log('👉 Next step: Open supabase/seed_catalog.sql, copy all, and click Run in the Supabase SQL Editor!');
  }
}

buildAndSeedCatalog();