/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { DiscoverItem } from '@/lib/discoverFeed';
import { discountAmount, findDiscount } from '@/lib/discounts';

export interface CartLine {
  /** Unique per product + colour + size. */
  key: string;
  item: DiscoverItem;
  qty: number;
  color?: string;
  size?: string;
}

/** Shown in place of the cart once a mock order goes through. */
export function OrderPlaced({ onDone }: { onDone: () => void }) {
  return (
    <div className="saved-empty order-placed" role="status">
      <span><Icon name="check" size={26} /></span>
      <h2>Order placed</h2>
      <p>This was a mock checkout, so nothing was charged. Find your pieces under Purchased in your profile.</p>
      <button onClick={onDone}>Done</button>
    </div>
  );
}

export const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  onBack: () => void;
  lines: CartLine[];
  onChangeQty: (key: string, delta: 1 | -1) => void;
  appliedCode: string | null;
  onApplyCode: (code: string | null) => void;
  /** Mock checkout: resolves to a reason it didn't go through, or null when the order is placed. */
  onCheckout: () => string | null;
}

export default function CartScreen({ nav, onNav, onBack, lines, onChangeQty, appliedCode, onApplyCode, onCheckout }: Props) {
  const [done, setDone] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const discount = findDiscount(appliedCode ?? '');
  const saving = discountAmount(discount, subtotal);
  const total = subtotal - saving;

  const applyCode = () => {
    const found = findDiscount(input);
    if (!input.trim()) return;
    if (!found) {
      setError('That code isn’t valid.');
      return;
    }
    setError(null);
    setInput('');
    onApplyCode(found.code);
  };

  if (done) {
    return (
      <main className="app-shell">
        <section className="phone cart-screen" aria-label="Order placed">
          <OrderPlaced onDone={onBack} />
          <BottomNav current={null} onChange={onNav} variant="home" />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone cart-screen" aria-label="Shopping cart">
        <div className="cart-scroll">
          <header className="settings-top">
            <button className="header-action" onClick={onBack} aria-label="Back"><Icon name="back" size={21} /></button>
            <h1>Cart{count > 0 && <small>{count} {count === 1 ? 'item' : 'items'}</small>}</h1>
            <span />
          </header>

          {lines.length === 0 ? (
            <div className="saved-empty cart-empty">
              <span><Icon name="cart" size={26} /></span>
              <h2>Your cart is empty</h2>
              <p>Swipe up on a piece in Discover to add it here.</p>
              <button onClick={() => onNav('discover')}>Keep browsing</button>
            </div>
          ) : (
            <ul className="cart-list">
              {lines.map(({ key, item, qty, color, size }) => (
                <li key={key} className="cart-item">
                  <img src={item.image} alt={item.alt} style={{ objectPosition: item.focus }} />
                  <div className="cart-info">
                    <small>{item.brand}</small>
                    <h2>{item.title}</h2>
                    <p>{color || size ? [color, size && (size === 'One size' ? size : `Size ${size}`)].filter(Boolean).join(' · ') : item.description}</p>
                    <div className="cart-bottom">
                      <strong>{money(item.price)}</strong>
                      <div className="qty" role="group" aria-label={`Quantity for ${item.title}`}>
                        <button onClick={() => onChangeQty(key, -1)} aria-label={qty === 1 ? 'Remove from cart' : 'Decrease quantity'}>
                          <Icon name={qty === 1 ? 'trash' : 'minus'} size={15} />
                        </button>
                        <span aria-live="polite">{qty}</span>
                        <button onClick={() => onChangeQty(key, 1)} aria-label="Increase quantity"><Icon name="plus" size={15} /></button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="cart-summary">
            {discount ? (
              <div className="promo-applied">
                <span><Icon name="gift" size={16} />{discount.code} · {discount.label}</span>
                <button onClick={() => onApplyCode(null)} aria-label="Remove discount code"><Icon name="x" size={14} /></button>
              </div>
            ) : (
              <>
                <form
                  className="promo-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCode();
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="Discount code"
                    aria-label="Discount code"
                    aria-invalid={error ? true : undefined}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button type="submit" disabled={!input.trim()}>Apply</button>
                </form>
                {error && <p className="promo-error" role="alert">{error}</p>}
              </>
            )}
            {discount && (
              <>
                <div className="cart-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="cart-line saving"><span>Discount</span><span>−{money(saving)}</span></div>
              </>
            )}
            <div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
            {checkoutError && <p className="promo-error" role="alert">{checkoutError}</p>}
            <button
              type="button"
              className="checkout-btn"
              onClick={() => {
                const reason = onCheckout();
                setCheckoutError(reason);
                if (!reason) setDone(true);
              }}
            >
              Checkout
            </button>
          </div>
        )}

        <BottomNav current={null} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
