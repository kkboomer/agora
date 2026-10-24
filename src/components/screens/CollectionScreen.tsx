/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomSheet from '@/components/ui/BottomSheet';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import { LIKED_ID, collectionCount, tilesOf, type Collection } from '@/lib/collections';
import ProductScreen from '@/components/screens/ProductScreen';
import { type Variant } from '@/components/ui/ProductSheet';
import type { DiscoverItem } from '@/lib/discoverFeed';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  onBack: () => void;
  collection: Collection;
  onUpdate?: (patch: Partial<Pick<Collection, 'name' | 'isPrivate'>>) => void;
  onDelete?: () => void;
  /** Viewing someone else's collection: no edit or delete. */
  readOnly?: boolean;
  ownerName?: string;
  onAddToCart: (itemId: string, variant: Variant) => void;
  cartCount: number;
  onOpenCart: () => void;
  isLiked: (itemId: string) => boolean;
  onToggleLike: (itemId: string) => void;
}

export default function CollectionScreen({ nav, onNav, onBack, collection, onUpdate, onDelete, readOnly = false, ownerName, onAddToCart, cartCount, onOpenCart, isLiked, onToggleLike }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(collection.name);
  const [draftPrivate, setDraftPrivate] = useState(collection.isPrivate);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [product, setProduct] = useState<DiscoverItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const builtIn = collection.id === LIKED_ID;
  const tiles = tilesOf(collection);
  const count = collectionCount(collection);
  // Pinterest-style: tiles go left, right, then back to the left below, and so on.
  const columns = [tiles.filter((_, i) => i % 2 === 0), tiles.filter((_, i) => i % 2 === 1)];

  const openEdit = () => {
    setDraftName(collection.name);
    setDraftPrivate(collection.isPrivate);
    setConfirmDelete(false);
    setEditing(true);
  };
  const closeEdit = () => {
    setEditing(false);
    setConfirmDelete(false);
  };
  const save = () => {
    onUpdate?.({ name: builtIn ? collection.name : draftName.trim() || collection.name, isPrivate: draftPrivate });
    closeEdit();
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };
  const share = async () => {
    // Mock link: there's no public collection page yet.
    const url = `${window.location.origin}/c/${collection.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: collection.name, text: `${collection.name} on Agora`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash('Link copied');
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to do.
    }
  };

  // A tapped piece opens as its own full screen; back returns to this collection.
  if (product) {
    return (
      <ProductScreen
        key={product.id}
        nav={nav}
        onNav={onNav}
        onBack={() => setProduct(null)}
        item={product}
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        liked={isLiked(product.id)}
        onToggleLike={() => onToggleLike(product.id)}
        onAddToCart={(variant) => onAddToCart(product.id, variant)}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="phone collection-screen" aria-label={collection.name}>
        <div className="collection-scroll">
          <header className="coll-top">
            <button className="header-action" onClick={onBack} aria-label="Back to profile"><Icon name="back" size={21} /></button>
            <div className="coll-title">
              <h1>{collection.name}</h1>
              <p>{count} {count === 1 ? 'piece' : 'pieces'} · {readOnly ? `by ${ownerName}` : collection.isPrivate ? 'Private' : 'Public'}</p>
            </div>
            <div className="coll-actions">
              <button className="header-action" onClick={share} aria-label="Share collection"><Icon name="share" size={19} /></button>
              {!readOnly && <button className="header-action" onClick={openEdit} aria-label="Edit collection"><Icon name="edit" size={19} /></button>}
            </div>
          </header>

          {tiles.length === 0 ? (
            <div className="saved-empty">
              <span><Icon name="bookmark" size={26} /></span>
              <h2>Nothing here yet</h2>
              <p>Tap Save on a piece in Discover to add it to this collection.</p>
              <button onClick={() => onNav('discover')}>Explore pieces</button>
            </div>
          ) : (
            <div className="masonry">
              {columns.map((col, ci) => (
                <div key={ci} className="masonry-col">
                  {col.map((t) => (
                    <button
                      key={t.item.id}
                      className="masonry-tile"
                      aria-label={`View ${t.item.title}`}
                      onClick={() => {
                        setProduct(t.item);
                      }}
                    >
                      <img src={t.item.image} alt="" style={{ aspectRatio: t.ratio, objectPosition: t.item.focus }} />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {toast && <div className="toast" role="status">{toast}</div>}

        {!readOnly && (
        <BottomSheet
          open={editing}
          onClose={closeEdit}
          label="Edit collection"
          height="56%"
          title={<div><h2>Edit collection</h2></div>}
        >
          <div className="edit-body">
            <label className="edit-field">
              <span>Name</span>
              <input
                value={draftName}
                maxLength={40}
                disabled={builtIn}
                onChange={(e) => setDraftName(e.target.value)}
                aria-label="Collection name"
              />
              {builtIn && <small>Cannot edit text</small>}
            </label>

            <div className="edit-row">
              <div>
                <strong>Private</strong>
                <small>{draftPrivate ? 'Only you can see this collection.' : 'Anyone with the link can see it.'}</small>
              </div>
              <button
                role="switch"
                aria-checked={draftPrivate}
                aria-label="Private"
                className={`switch ${draftPrivate ? 'on' : ''}`}
                onClick={() => setDraftPrivate((v) => !v)}
              ><span /></button>
            </div>

            <button className="sheet-save" onClick={save}>Save changes</button>

            {!builtIn && (
              confirmDelete ? (
                <div className="delete-confirm" role="alert">
                  <p>Delete “{collection.name}”? This can’t be undone.</p>
                  <div>
                    <button onClick={() => setConfirmDelete(false)}>Cancel</button>
                    <button className="danger" onClick={onDelete}>Delete</button>
                  </div>
                </div>
              ) : (
                <button className="delete-btn" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" size={16} />Delete collection
                </button>
              )
            )}
          </div>
        </BottomSheet>
        )}

        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
