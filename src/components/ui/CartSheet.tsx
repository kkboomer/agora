/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import { money, OrderPlaced, type CartLine } from '@/components/screens/CartScreen';
import { discountAmount, findDiscount } from '@/lib/discounts';

interface Props {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  onChangeQty: (key: string, delta: 1 | -1) => void;
  appliedCode: string | null;
  onApplyCode: (code: string | null) => void;
  /** Mock checkout: resolves to a reason it didn't go through, or null when the order is placed. */
  onCheckout: () => string | null;
}

/** Cart as a popup sheet: scrollable pieces, with discount and checkout pinned underneath. */
export default function CartSheet({ open, onClose, lines, onChangeQty, appliedCode, onApplyCode, onCheckout }: Props) {
  const [done, setDone] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const discount = findDiscount(appliedCode ?? '');
  const saving = discountAmount(discount, subtotal);

  const applyCode = () => {
    if (!input.trim()) return;
    const found = findDiscount(input);
    if (!found) {
      setError('That code isn’t valid.');
      return;
    }
    setError(null);
    setInput('');
    setPromoOpen(false);
    onApplyCode(found.code);
  };

  // Every way of closing the sheet goes through here, so the next visit starts on the cart, not the receipt.
  const close = () => {
    setDone(false);
    setCheckoutError(null);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      label="Shopping cart"
      height="70%"
      title={<div><h2>Cart</h2><p className="sheet-sub">{count} {count === 1 ? 'item' : 'items'}</p></div>}
    >
      {done ? (
        <OrderPlaced onDone={close} />
      ) : lines.length === 0 ? (
        <div className="saved-empty cart-sheet-empty">
          <span><Icon name="cart" size={26} /></span>
          <h2>Your cart is empty</h2>
          <p>Swipe up on a piece to add it here.</p>
        </div>
      ) : (
        <>
          <ul className="cart-list cart-sheet-list">
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

          <div className="cart-sheet-footer">
            {discount ? (
              <div className="promo-applied">
                <span><Icon name="gift" size={16} />{discount.code} · {discount.label}</span>
                <button onClick={() => onApplyCode(null)} aria-label="Remove discount code"><Icon name="x" size={14} /></button>
              </div>
            ) : promoOpen ? (
              <>
                <form
                  className="promo-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCode();
                  }}
                >
                  <input
                    autoFocus
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
            ) : (
              <button type="button" className="promo-toggle" onClick={() => setPromoOpen(true)}>
                <Icon name="gift" size={15} />Add discount code
              </button>
            )}
            {discount && (
              <div className="cart-line saving"><span>Discount</span><span>−{money(saving)}</span></div>
            )}
            <div className="cart-total"><span>Total</span><strong>{money(subtotal - saving)}</strong></div>
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
        </>
      )}
    </BottomSheet>
  );
}
