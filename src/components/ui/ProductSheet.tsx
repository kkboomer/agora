/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import type { DiscoverItem } from '@/lib/discoverFeed';

export interface Variant {
  color: string;
  size: string;
}

interface Props {
  item: DiscoverItem;
  open: boolean;
  onClose: () => void;
  onAddToCart: (variant: Variant) => void;
}

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** Product card: photo, info, colour swatches, size chips and an Add to cart button. */
export default function ProductSheet({ item, open, onClose, onAddToCart }: Props) {
  const [color, setColor] = useState(item.colorOptions[0]?.name ?? '');
  const [size, setSize] = useState<string | null>(null);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={item.title}
      height="78%"
      title={<div><h2>{item.title}</h2><p className="sheet-sub">{item.brand}</p></div>}
    >
      <div className="product-body">
        <div className="product-summary">
          <img src={item.image} alt={item.alt} style={{ objectPosition: item.focus }} />
          <div>
            <strong>{money(item.price)}</strong>
            <p>{item.description}</p>
          </div>
        </div>

        <section aria-label="Color">
          <div className="opt-label"><span>Color</span><strong>{color}</strong></div>
          <div className="swatches" role="radiogroup" aria-label="Color">
            {item.colorOptions.map((c) => (
              <button
                key={c.name}
                role="radio"
                aria-checked={color === c.name}
                aria-label={c.name}
                className={`swatch ${color === c.name ? 'on' : ''}`}
                onClick={() => setColor(c.name)}
              >
                <span style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Size">
          <div className="opt-label"><span>Size</span><strong>{size ?? 'Select a size'}</strong></div>
          <div className="sizes" role="radiogroup" aria-label="Size">
            {item.sizes.map((s) => (
              <button key={s} role="radio" aria-checked={size === s} className={`size-chip ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </section>

        <button className="add-cart-btn" disabled={!size} onClick={() => size && onAddToCart({ color, size })}>
          <Icon name="cart" size={18} />
          {size ? `Add to cart · ${money(item.price)}` : 'Select a size'}
        </button>
      </div>
    </BottomSheet>
  );
}
