/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { Variant } from '@/components/ui/ProductSheet';
import { money } from '@/components/screens/CartScreen';
import type { DiscoverItem } from '@/lib/discoverFeed';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  onBack: () => void;
  item: DiscoverItem;
  cartCount: number;
  onOpenCart: () => void;
  liked: boolean;
  onToggleLike: () => void;
  onAddToCart: (variant: Variant) => void;
}

/** Full-screen product page: big photo, then colour and size options and Add to cart. */
export default function ProductScreen({ nav, onNav, onBack, item, cartCount, onOpenCart, liked, onToggleLike, onAddToCart }: Props) {
  const [color, setColor] = useState(item.colorOptions[0]?.name ?? '');
  const [size, setSize] = useState<string | null>(item.sizes.length === 1 ? item.sizes[0] : null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const add = () => {
    if (!size) return;
    onAddToCart({ color, size });
    window.clearTimeout(timer.current);
    setToast('Added to cart');
    timer.current = window.setTimeout(() => setToast(null), 2000);
  };

  return (
    <main className="app-shell">
      <section className="phone product-screen" aria-label={item.title}>
          <button className="glass-button hero-back" onClick={onBack} aria-label="Back"><Icon name="back" size={21} /></button>
          <button className="glass-button hero-cart cart-button" onClick={onOpenCart} aria-label={`Shopping cart, ${cartCount} items`}>
            <Icon name="cart" size={21} />{cartCount > 0 && <span>{cartCount}</span>}
          </button>
        <div className="product-page-scroll">
          <div className="product-hero">
            <img src={item.image} alt={item.alt} style={{ objectPosition: item.focus }} />
            <button className={`hero-like ${liked ? 'on' : ''}`} onClick={onToggleLike} aria-pressed={liked} aria-label={liked ? 'Remove from liked items' : 'Add to liked items'}>
              <Icon name="heart" size={20} filled={liked} />
            </button>
          </div>

          <div className="product-details">
            <small>{item.brand}</small>
            <h1>{item.title}</h1>
            <strong className="product-price">{money(item.price)}</strong>
            <p className="product-desc">{item.description}</p>

            <section aria-label="Color">
              <div className="opt-label"><span>Color</span><strong>{color}</strong></div>
              <div className="swatches" role="radiogroup" aria-label="Color">
                {item.colorOptions.map((c) => (
                  <button key={c.name} role="radio" aria-checked={color === c.name} aria-label={c.name} className={`swatch ${color === c.name ? 'on' : ''}`} onClick={() => setColor(c.name)}>
                    <span style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </section>

            <section aria-label="Size">
              <div className="opt-label"><span>Size</span><strong>{size ?? 'Select a size'}</strong></div>
              <div className="sizes" role="radiogroup" aria-label="Size">
                {item.sizes.map((s) => (
                  <button key={s} role="radio" aria-checked={size === s} className={`size-chip ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="product-cta">
          <button className="add-cart-btn" disabled={!size} onClick={add}>
            <Icon name="cart" size={18} />
            {size ? `Add to cart · ${money(item.price)}` : 'Select a size'}
          </button>
        </div>

        {toast && <div className="toast" role="status">{toast}</div>}
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
