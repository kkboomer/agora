/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { StyleFilter } from '@/components/screens/SearchScreen';
import ReviewsSheet from '@/components/ui/ReviewsSheet';
import type { Variant } from '@/components/ui/ProductSheet';
import SignInSheet from '@/components/ui/SignInSheet';
import CartSheet from '@/components/ui/CartSheet';
import type { CartLine } from '@/components/screens/CartScreen';
import CollectionSheet from '@/components/ui/CollectionSheet';
import type { Collection } from '@/lib/collections';
import { reviewsFor, type Review } from '@/lib/reviews';
import { DISCOVER_ITEMS, type DiscoverItem } from '@/lib/discoverFeed';
import FilterSheet from '@/components/ui/FilterSheet';
import { activeFilterCount, matchesFilters, type ProductFilters } from '@/lib/filters';

export type SwipeIntent = 'like' | 'reject' | 'cart';

const filterLabel = (f: StyleFilter) => (f.query ? `“${f.query}”` : `${f.gender === 'men' ? 'Men’s' : 'Women’s'} ${f.category}`);

export const FEED_TABS = ['Trending', 'For You', 'Friends', 'Discover'] as const;
export type FeedTab = (typeof FEED_TABS)[number];

/** Distance (px) at which a drag counts as a committed swipe. */
const THRESHOLD = 110;
const FLING_VELOCITY = 600;

interface DragState {
  intent: SwipeIntent | null;
  strength: number; // 0..1
}
const IDLE: DragState = { intent: null, strength: 0 };

function readIntent(x: number, y: number): DragState {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax < 8 && ay < 8) return IDLE;
  if (ax >= ay)
    return {
      intent: x > 0 ? 'like' : 'reject',
      strength: Math.min(ax / THRESHOLD, 1),
    };
  // Vertical drags, up or down, add to cart.
  return { intent: 'cart', strength: Math.min(ay / THRESHOLD, 1) };
}

interface OptionsState {
  open: boolean;
  onToggle: () => void;
  color: string | null;
  onColor: (color: string) => void;
  size: string | null;
  onSize: (size: string) => void;
}

function CardFace({ item, filter, options }: { item: DiscoverItem; filter: StyleFilter | null; options?: OptionsState }) {
  const summary = options && (options.size || options.color) ? [options.size, options.color].filter(Boolean).join(' · ') : 'View options';
  return (
    <>
      <img src={item.image} alt={item.alt} draggable={false} style={{ objectPosition: item.focus }} />
      <div className="product-info">
        <div className="brand-row">
          <span>{item.brand}</span>
          {filter && <span className="more-hint">· more {(filter.query ?? filter.category ?? '').toLowerCase()} as you scroll</span>}
        </div>
        <h1>{item.title}</h1>
        <div className="meta">
          <span>${item.price}</span>
          <span className="dot">•</span>
          <button
            type="button"
            data-options
            className={`options-toggle ${options?.open ? 'open' : ''}`}
            aria-expanded={options?.open ?? false}
            tabIndex={options ? 0 : -1}
            onClick={options?.onToggle}
          >
            {summary}
            <Icon name="arrow" size={13} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {options?.open && (
            <motion.div
              key="options"
              className="options-wrap"
              initial={{ height: 0, opacity: 0, y: 14 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 14 }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <div className="options-panel" data-options>
                {item.colorOptions.length > 1 && (
                  <div className="opt-group">
                    <span className="opt-title">Color{options.color ? ` · ${options.color}` : ''}</span>
                    <div className="opt-swatches" role="radiogroup" aria-label="Color">
                      {item.colorOptions.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          role="radio"
                          aria-checked={options.color === c.name}
                          aria-label={c.name}
                          className={`opt-swatch ${options.color === c.name ? 'on' : ''}`}
                          onClick={() => options.onColor(c.name)}
                        >
                          <span style={{ background: c.hex }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="opt-group">
                  <span className="opt-title">
                    {item.sizes.length > 1 ? 'Size' : 'Fit'}
                    {item.sizes.length <= 1 ? ' · One size' : ''}
                  </span>
                  {item.sizes.length > 1 && (
                    <div className="opt-sizes" role="radiogroup" aria-label="Size">
                      {item.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          role="radio"
                          aria-checked={options.size === sz}
                          className={`opt-size ${options.size === sz ? 'on' : ''}`}
                          onClick={() => options.onSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

interface Props {
  /** Changes when products are added to the deck, so the feed is rebuilt. */
  deckVersion?: number;
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  feedTab: FeedTab;
  onFeedTab: (tab: FeedTab) => void;
  collections: Collection[];
  onToggleCollection: (collectionId: string, itemId: string) => void;
  onCreateCollection: (name: string, itemId: string, isPrivate: boolean) => void;
  cartCount: number;
  lines: CartLine[];
  onChangeQty: (key: string, delta: 1 | -1) => void;
  appliedCode: string | null;
  onApplyCode: (code: string | null) => void;
  onSwipe: (intent: SwipeIntent, id: string, variant?: Variant) => void;
  reviews: Review[];
  filter: StyleFilter | null;
  productFilters: ProductFilters;
  onProductFilters: (filters: ProductFilters) => void;
  onSearch: (query: string) => void;
  guest?: boolean;
  onSignIn: () => void;
  onClearFilter: () => void;
}

export default function DiscoverScreen({
  deckVersion = 0,
  nav,
  onNav,
  feedTab,
  onFeedTab,
  collections,
  onToggleCollection,
  onCreateCollection,
  onSwipe,
  cartCount,
  lines,
  onChangeQty,
  appliedCode,
  onApplyCode,
  reviews,
  filter,
  productFilters: filters,
  onProductFilters: setFilters,
  onSearch,
  guest = false,
  onSignIn,
  onClearFilter,
}: Props) {
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [cartOpen, setCartOpen] = useState(false);
  const [signInPrompt, setSignInPrompt] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const filterCount = activeFilterCount(filters);
  const [optsOpen, setOptsOpen] = useState(false);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(IDLE);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const busy = useRef(false);
  const tabsRef = useRef<HTMLElement>(null);
  const firstTabScroll = useRef(true);
  const tabDrag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScroll: 0,
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  // The card behind grows into place as the front card is pulled away.
  const nextScale = useTransform([x, y], ([lx, ly]: number[]) => 0.94 + 0.06 * Math.min(Math.hypot(lx, ly) / THRESHOLD, 1));

  // The deck is the feed narrowed by the filters sheet (a stand-in for querying the API with them).
  const feed = useMemo(() => {
    // Database products are pushed onto DISCOVER_ITEMS (same array as the catalog), hence deckVersion.
    const matches = DISCOVER_ITEMS.filter((i) => matchesFilters(i, filters));
    return matches.length ? matches : [...DISCOVER_ITEMS];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, deckVersion]);
  const item = feed[index % feed.length];

  // Tapping anywhere outside the options collapses them.
  useEffect(() => {
    if (!optsOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest('[data-options]')) setOptsOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [optsOpen]);

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };
  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    closeSearch();
    setIndex(0);
    onSearch(q);
  };
  useEffect(() => {
    if (!searching) return;
    searchRef.current?.focus();
    // Tapping anywhere outside the search bar (or its button) collapses it.
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest('[data-search]')) closeSearch();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [searching]);

  const flash = (message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };
  // One-size items need no pick; colour is optional, so it defaults to the first.
  const oneSize = item.sizes.length <= 1;
  const chosenSize = oneSize ? (item.sizes[0] ?? '') : size;
  const chosenColor = color ?? item.colorOptions[0]?.name ?? '';

  const shareItem = async () => {
    // Mock link: there's no public product page yet.
    const url = `${window.location.origin}/p/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `${item.title} by ${item.brand} on Agora`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash('Link copied');
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to do.
    }
  };
  const nextItem = feed[(index + 1) % feed.length];
  const saved = collections.some((c) => c.itemIds.includes(item.id));
  const reviewCount = reviewsFor(item.id, reviews).length;

  // Keep the selected tab centred in the scrollable strip.
  useEffect(() => {
    const strip = tabsRef.current;
    const btn = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!strip || !btn) return;
    strip.scrollTo({
      left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2,
      behavior: firstTabScroll.current ? 'instant' : 'smooth',
    });
    firstTabScroll.current = false;
  }, [feedTab, searching]);

  // Warm the cache so the next photo is ready when the fade-in starts.
  useEffect(() => {
    const upcoming = feed[(index + 2) % feed.length];
    const img = new Image();
    img.src = upcoming.image;
  }, [index, feed]);

  const commit = async (intent: SwipeIntent) => {
    if (busy.current) return;
    if (intent === 'cart' && !chosenSize) {
      // Size is required: bounce back, open the options and say why.
      const spring = { type: 'spring' as const, stiffness: 420, damping: 32 };
      animate(x, 0, spring);
      animate(y, 0, spring);
      setDrag(IDLE);
      setOptsOpen(true);
      flash('Choose a size first');
      return;
    }
    busy.current = true;
    setDrag({ intent, strength: 1 });

    const exit = { duration: 0.28, ease: 'easeIn' as const };
    const toX = intent === 'like' ? 420 : intent === 'reject' ? -420 : x.get();
    // Fly off the way it was dragged; a button tap (no drag yet) goes up.
    const toY = intent === 'cart' ? (y.get() > 0 ? 640 : -640) : y.get();
    await Promise.all([animate(x, toX, exit), animate(y, toY, exit), animate(opacity, 0, exit)]);

    onSwipe(intent, item.id, intent === 'cart' ? { color: chosenColor, size: chosenSize ?? '' } : undefined);
    // The card behind is already showing the next item, so swap the front card to it
    // and reset in a single paint: no flash, no gap.
    flushSync(() => {
      setIndex((i) => i + 1);
      setDrag(IDLE);
      setOptsOpen(false);
      setColor(null);
      setSize(null);
    });
    x.set(0);
    y.set(0);
    opacity.set(1);
    busy.current = false;
  };

  const handleDrag = () => setDrag(readIntent(x.get(), y.get()));

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const { intent, strength } = readIntent(x.get(), y.get());
    if (intent) {
      const v = intent === 'cart' ? Math.abs(info.velocity.y) : intent === 'like' ? info.velocity.x : -info.velocity.x;
      if (strength >= 1 || (v > FLING_VELOCITY && strength > 0.25)) {
        commit(intent);
        return;
      }
    }
    // Not far enough: spring back.
    const spring = { type: 'spring' as const, stiffness: 420, damping: 32 };
    animate(x, 0, spring);
    animate(y, 0, spring);
    setDrag(IDLE);
  };

  // Progress for a given action button: grows + fills as the drag leans toward it.
  const btn = (intent: SwipeIntent) => {
    const p = drag.intent === intent ? drag.strength : 0;
    return { active: p >= 0.35, style: { transform: `scale(${1 + 0.3 * p})` } };
  };
  const reject = btn('reject');
  const bag = btn('cart');
  const like = btn('like');

  return (
    <main className="app-shell">
      <section className="phone" aria-label="Fashion discovery">
        <div className="product-photo">
          <motion.div className="swipe-card back" aria-hidden="true" style={{ scale: nextScale }}>
            <CardFace item={nextItem} filter={filter} />
          </motion.div>
          <motion.div
            className="swipe-card"
            drag
            dragMomentum={false}
            dragElastic={0.9}
            style={{ x, y, rotate, opacity }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          >
            <CardFace
              item={item}
              filter={filter}
              options={{
                open: optsOpen,
                onToggle: () => setOptsOpen((o) => !o),
                color,
                onColor: setColor,
                size,
                onSize: setSize,
              }}
            />
          </motion.div>
          <div className="top-shade" />

          <header className="top-bar">
            <button className={`glass-button ${filterCount ? 'filters-on' : ''}`} aria-label={filterCount ? `Filters, ${filterCount} active` : 'Filters'} onClick={() => setFiltersOpen(true)}>
              <Icon name="sliders" size={21} />
            </button>
            <nav
              className="feed-tabs"
              hidden={searching}
              aria-label="Feed"
              ref={tabsRef}
              onPointerDown={(e) => {
                // Mouse click-and-drag to scroll; touch already scrolls natively.
                if (e.pointerType !== 'mouse') return;
                tabDrag.current = {
                  active: true,
                  moved: false,
                  startX: e.clientX,
                  startScroll: e.currentTarget.scrollLeft,
                };
              }}
              onPointerMove={(e) => {
                const d = tabDrag.current;
                if (!d.active) return;
                const dx = e.clientX - d.startX;
                if (!d.moved && Math.abs(dx) > 4) {
                  d.moved = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
                if (d.moved) e.currentTarget.scrollLeft = d.startScroll - dx;
              }}
              onPointerUp={() => {
                tabDrag.current.active = false;
              }}
              onPointerCancel={() => {
                tabDrag.current.active = false;
              }}
              onClickCapture={(e) => {
                // A drag shouldn't also count as a tap on whichever tab it ended over.
                if (tabDrag.current.moved) {
                  e.stopPropagation();
                  e.preventDefault();
                  tabDrag.current.moved = false;
                }
              }}
              onWheel={(e) => {
                // Let a plain mouse wheel scroll the strip sideways.
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
              {FEED_TABS.map((t) => (
                <button key={t} className={feedTab === t ? 'active' : ''} aria-current={feedTab === t ? 'true' : undefined} onClick={() => onFeedTab(t)}>
                  {t}
                </button>
              ))}
            </nav>
            {searching && (
              <motion.form
                className="top-search"
                data-search
                role="search"
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
              >
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  placeholder="Search pieces, brands, styles"
                  aria-label="Search Agora"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeSearch();
                  }}
                />
              </motion.form>
            )}
            <button
              className="glass-button"
              data-search
              aria-label={searching ? (query.trim() ? 'Search' : 'Close search') : 'Search'}
              onClick={() => (searching ? (query.trim() ? runSearch() : closeSearch()) : setSearching(true))}
            >
              <Icon name={searching && !query.trim() ? 'x' : 'search'} size={21} />
            </button>
          </header>

          {filter && (
            <div className="filter-chip" role="status">
              <span>
                Showing <strong>{filterLabel(filter)}</strong>
              </span>
              <button onClick={onClearFilter} aria-label="Clear filter">
                <Icon name="x" size={14} />
              </button>
            </div>
          )}

          <aside className="social-actions">
            <button aria-label={`See ${reviewCount} reviews`} onClick={() => setReviewsOpen(true)}>
              <span className="action-circle">
                <Icon name="message" />
              </span>
              <small>{reviewCount}</small>
            </button>
            <button aria-label={saved ? 'Remove bookmark' : 'Bookmark'} onClick={() => setCollectionsOpen(true)}>
              <span className={`action-circle ${saved ? 'selected' : ''}`}>
                <Icon name="bookmark" filled={saved} />
              </span>
              <small>{saved ? 'Saved' : 'Save'}</small>
            </button>
            <button aria-label={`Shopping cart, ${cartCount} items`} onClick={() => setCartOpen(true)}>
              <span className="action-circle cart-circle">
                <Icon name="cart" />
                {cartCount > 0 && <b>{cartCount}</b>}
              </span>
              <small>Cart</small>
            </button>
            <button aria-label="Share product" onClick={shareItem}>
              <span className="action-circle">
                <Icon name="share" />
              </span>
              <small>Share</small>
            </button>
          </aside>
        </div>

        <div className="decision-panel">
          <button className={`decision reject ${reject.active ? 'active' : ''}`} style={reject.style} aria-label="Not for me" onClick={() => commit('reject')}>
            <Icon name="x" size={29} />
          </button>
          <button className={`decision bag ${bag.active ? 'active' : ''}`} style={bag.style} aria-label="Add to cart" onClick={() => commit('cart')}>
            <Icon name="cart" size={26} filled={bag.active} />
          </button>
          <button className={`decision like ${like.active ? 'active' : ''}`} style={like.style} aria-label="Like" onClick={() => commit('like')}>
            <Icon name="heart" size={28} filled={like.active} />
          </button>
        </div>

        <BottomNav current={nav} onChange={onNav} variant="discovery" />

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}

        <FilterSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          applied={filters}
          onApply={(f) => {
            setFilters(f);
            setIndex(0);
          }}
          countFor={(f) => DISCOVER_ITEMS.filter((i) => matchesFilters(i, f)).length}
        />
        <CartSheet
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          lines={lines}
          onChangeQty={onChangeQty}
          appliedCode={appliedCode}
          onApplyCode={onApplyCode}
        />
        <ReviewsSheet item={item} reviews={reviews} open={reviewsOpen} onClose={() => setReviewsOpen(false)} />
        <CollectionSheet
          item={item}
          collections={collections}
          open={collectionsOpen}
          onClose={() => setCollectionsOpen(false)}
          onToggle={(cid) => onToggleCollection(cid, item.id)}
          onBlockedCreate={guest ? () => setSignInPrompt(true) : undefined}
          onCreate={(name, isPrivate) => onCreateCollection(name, item.id, isPrivate)}
        />
        {/* Last, so it stacks above the collections sheet it can be opened from. */}
        <SignInSheet open={signInPrompt} onClose={() => setSignInPrompt(false)} onSignIn={onSignIn} action="create collections" />
      </section>
    </main>
  );
}
