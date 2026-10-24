/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { StyleFilter } from '@/components/screens/SearchScreen';
import ReviewsSheet from '@/components/ui/ReviewsSheet';
import CollectionSheet from '@/components/ui/CollectionSheet';
import type { Collection } from '@/lib/collections';
import { reviewsFor, type Review } from '@/lib/reviews';
import { DISCOVER_ITEMS, type DiscoverItem } from '@/lib/discoverFeed';

export type SwipeIntent = 'like' | 'reject' | 'cart';

const filterLabel = (f: StyleFilter) =>
  f.query ? `“${f.query}”` : `${f.gender === 'men' ? 'Men’s' : 'Women’s'} ${f.category}`;

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
  if (ax >= ay) return { intent: x > 0 ? 'like' : 'reject', strength: Math.min(ax / THRESHOLD, 1) };
  // Vertical drags, up or down, add to cart.
  return { intent: 'cart', strength: Math.min(ay / THRESHOLD, 1) };
}

function CardFace({ item, filter }: { item: DiscoverItem; filter: StyleFilter | null }) {
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
          {item.colors && <><span className="dot">•</span><span>{item.colors} colors</span></>}
        </div>
      </div>
    </>
  );
}

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  feedTab: FeedTab;
  onFeedTab: (tab: FeedTab) => void;
  collections: Collection[];
  onToggleCollection: (collectionId: string, itemId: string) => void;
  onCreateCollection: (name: string, itemId: string) => void;
  onSwipe: (intent: SwipeIntent, id: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  reviews: Review[];
  filter: StyleFilter | null;
  onOpenSearch: () => void;
  onClearFilter: () => void;
}

export default function DiscoverScreen({
  nav, onNav, feedTab, onFeedTab, collections, onToggleCollection, onCreateCollection, onSwipe, cartCount, onOpenCart, reviews, filter, onOpenSearch, onClearFilter,
}: Props) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<DragState>(IDLE);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const busy = useRef(false);
  const tabsRef = useRef<HTMLElement>(null);
  const firstTabScroll = useRef(true);
  const tabDrag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  // The card behind grows into place as the front card is pulled away.
  const nextScale = useTransform([x, y], ([lx, ly]: number[]) => 0.94 + 0.06 * Math.min(Math.hypot(lx, ly) / THRESHOLD, 1));

  const item = DISCOVER_ITEMS[index % DISCOVER_ITEMS.length];
  const nextItem = DISCOVER_ITEMS[(index + 1) % DISCOVER_ITEMS.length];
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
  }, [feedTab]);

  // Warm the cache so the next photo is ready when the fade-in starts.
  useEffect(() => {
    const upcoming = DISCOVER_ITEMS[(index + 2) % DISCOVER_ITEMS.length];
    const img = new Image();
    img.src = upcoming.image;
  }, [index]);

  const commit = async (intent: SwipeIntent) => {
    if (busy.current) return;
    busy.current = true;
    setDrag({ intent, strength: 1 });

    const exit = { duration: 0.28, ease: 'easeIn' as const };
    const toX = intent === 'like' ? 420 : intent === 'reject' ? -420 : x.get();
    // Fly off the way it was dragged; a button tap (no drag yet) goes up.
    const toY = intent === 'cart' ? (y.get() > 0 ? 640 : -640) : y.get();
    await Promise.all([animate(x, toX, exit), animate(y, toY, exit), animate(opacity, 0, exit)]);

    onSwipe(intent, item.id);
    // The card behind is already showing the next item, so swap the front card to it
    // and reset in a single paint: no flash, no gap.
    flushSync(() => {
      setIndex((i) => i + 1);
      setDrag(IDLE);
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
            <CardFace item={item} filter={filter} />
          </motion.div>
          <div className="top-shade" />

          <header className="top-bar">
            <button className="glass-button" aria-label="Browse by style" onClick={onOpenSearch}><Icon name="sliders" size={21} /></button>
            <nav
              className="feed-tabs"
              aria-label="Feed"
              ref={tabsRef}
              onPointerDown={(e) => {
                // Mouse click-and-drag to scroll; touch already scrolls natively.
                if (e.pointerType !== 'mouse') return;
                tabDrag.current = { active: true, moved: false, startX: e.clientX, startScroll: e.currentTarget.scrollLeft };
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
                <button key={t} className={feedTab === t ? 'active' : ''} aria-current={feedTab === t ? 'true' : undefined} onClick={() => onFeedTab(t)}>{t}</button>
              ))}
            </nav>
            <button className="glass-button cart-button" aria-label={`Shopping cart, ${cartCount} items`} onClick={onOpenCart}>
              <Icon name="cart" size={21} />{cartCount > 0 && <span>{cartCount}</span>}
            </button>
          </header>

          {filter && (
            <div className="filter-chip" role="status">
              <span>Showing <strong>{filterLabel(filter)}</strong></span>
              <button onClick={onClearFilter} aria-label="Clear filter"><Icon name="x" size={14} /></button>
            </div>
          )}

          <aside className="social-actions">
            <button aria-label={`See ${reviewCount} reviews`} onClick={() => setReviewsOpen(true)}><span className="action-circle"><Icon name="message" /></span><small>{reviewCount}</small></button>
            <button aria-label={saved ? 'Remove bookmark' : 'Bookmark'} onClick={() => setCollectionsOpen(true)}>
              <span className={`action-circle ${saved ? 'selected' : ''}`}><Icon name="bookmark" filled={saved} /></span>
              <small>{saved ? 'Saved' : 'Save'}</small>
            </button>
            <button aria-label="Share product"><span className="action-circle"><Icon name="share" /></span><small>Share</small></button>
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

        <ReviewsSheet item={item} reviews={reviews} open={reviewsOpen} onClose={() => setReviewsOpen(false)} />
        <CollectionSheet
          item={item}
          collections={collections}
          open={collectionsOpen}
          onClose={() => setCollectionsOpen(false)}
          onToggle={(cid) => onToggleCollection(cid, item.id)}
          onCreate={(name) => onCreateCollection(name, item.id)}
        />
      </section>
    </main>
  );
}
