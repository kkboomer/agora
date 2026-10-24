'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import { COLOR_FAMILIES, EMPTY_FILTERS, FIT_OPTIONS, PRICE_RANGE, SIZE_OPTIONS, STYLE_OPTIONS, type ProductFilters } from '@/lib/filters';

interface Props {
  open: boolean;
  onClose: () => void;
  applied: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  /** How many pieces a draft would show, so Apply can say so (and refuse zero). */
  countFor: (filters: ProductFilters) => number;
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
// Pick a readable tick colour for the swatch behind it.
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
};
const price = (n: number) => (n >= PRICE_RANGE.max ? `$${n}+` : `$${n}`);

/** Collapsible filter section: the header shows what's selected, the body animates open. */
function Group({ label, summary, children }: { label: string; summary?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`filter-group ${open ? 'open' : ''}`} aria-label={label}>
      <button type="button" className="filter-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span>
        {summary && <small>{summary}</small>}
        <Icon name="arrow" size={16} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="filter-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="filter-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (next: string[]) => void }) {
  return (
    <Group label={label} summary={value.join(', ')}>
      <div className="sizes">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value.includes(o)} className={`size-chip ${value.includes(o) ? 'on' : ''}`} onClick={() => onChange(toggle(value, o))}>{o}</button>
        ))}
      </div>
    </Group>
  );
}

/** Filter popup for the Discover feed: price, size, colour, style and fit. */
export default function FilterSheet({ open, onClose, applied, onApply, countFor }: Props) {
  const [draft, setDraft] = useState(applied);
  // Start from what's applied each time the sheet opens, so cancelling discards edits.
  useEffect(() => {
    if (open) setDraft(applied);
  }, [open, applied]);

  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const count = countFor(draft);
  const span = PRICE_RANGE.max - PRICE_RANGE.min;
  const left = ((draft.minPrice - PRICE_RANGE.min) / span) * 100;
  const right = 100 - ((draft.maxPrice - PRICE_RANGE.min) / span) * 100;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="Filters"
      height="78%"
      title={<div><h2>Filters</h2></div>}
    >
      <div className="filter-body">
        <Group label="Price" summary={draft.minPrice > PRICE_RANGE.min || draft.maxPrice < PRICE_RANGE.max ? `${price(draft.minPrice)} – ${price(draft.maxPrice)}` : undefined}>
          <div className="range-readout">{price(draft.minPrice)} – {price(draft.maxPrice)}</div>
          <div className="range">
            <div className="range-track"><span style={{ left: `${left}%`, right: `${right}%` }} /></div>
            <input
              type="range"
              aria-label="Minimum price"
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              step={PRICE_RANGE.step}
              value={draft.minPrice}
              onChange={(e) => set('minPrice', Math.min(Number(e.target.value), draft.maxPrice - PRICE_RANGE.step))}
            />
            <input
              type="range"
              aria-label="Maximum price"
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              step={PRICE_RANGE.step}
              value={draft.maxPrice}
              onChange={(e) => set('maxPrice', Math.max(Number(e.target.value), draft.minPrice + PRICE_RANGE.step))}
            />
          </div>
        </Group>

        <Chips label="Size" options={SIZE_OPTIONS} value={draft.sizes} onChange={(v) => set('sizes', v)} />

        <Group label="Color" summary={draft.colors.join(', ')}>
          <div className="color-grid">
            {COLOR_FAMILIES.map((c) => {
              const on = draft.colors.includes(c.name);
              return (
                <button key={c.name} type="button" aria-pressed={on} className={`color-opt ${on ? 'on' : ''}`} onClick={() => set('colors', toggle(draft.colors, c.name))}>
                  <span className="color-chip" style={{ background: c.hex, color: isLight(c.hex) ? '#1d1b18' : 'white' }}>{on && <Icon name="check" size={15} />}</span>
                  <span className="color-name">{c.name}</span>
                </button>
              );
            })}
          </div>
        </Group>

        <Chips label="Style" options={STYLE_OPTIONS} value={draft.styles} onChange={(v) => set('styles', v)} />
        <Chips label="Fit" options={FIT_OPTIONS} value={draft.fits} onChange={(v) => set('fits', v)} />
      </div>

      <div className="filter-footer">
        <button type="button" className="filter-reset" onClick={() => setDraft(EMPTY_FILTERS)}>Reset</button>
        <button
          type="button"
          className="sheet-save"
          disabled={count === 0}
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          {count === 0 ? 'No matching pieces' : `Show ${count} ${count === 1 ? 'piece' : 'pieces'}`}
        </button>
      </div>
    </BottomSheet>
  );
}
