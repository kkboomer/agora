/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Stars from '@/components/ui/Stars';
import StarPicker from '@/components/ui/StarPicker';
import BottomSheet from '@/components/ui/BottomSheet';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import { findProduct } from '@/lib/discoverFeed';
import { LIKED_ID, collectionCount, tilesOf, type Collection } from '@/lib/collections';
import { PURCHASES } from '@/lib/purchases';
import type { Review } from '@/lib/reviews';
import { money } from '@/components/screens/CartScreen';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  collections: Collection[];
  onOpenCollection: (id: string) => void;
  onCreateCollection: (name: string, isPrivate: boolean) => void;
  name: string;
  onOpenSettings: () => void;
  /** The signed-in user's reviews, keyed by item id. */
  myReviews: Record<string, Review>;
  onSaveReview: (itemId: string, rating: number, text: string) => void;
}

export default function ProfileScreen({ nav, onNav, collections, onOpenCollection, onCreateCollection, name, onOpenSettings, myReviews, onSaveReview }: Props) {
  const [profileTab, setProfileTab] = useState<'collections' | 'purchased'>('collections');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrivate, setNewPrivate] = useState(true);

  const startReview = (itemId: string) => {
    const existing = myReviews[itemId];
    setRating(existing?.rating ?? 0);
    setText(existing?.text ?? '');
    setEditingId(itemId);
  };
  const postReview = (itemId: string) => {
    if (!rating) return;
    onSaveReview(itemId, rating, text.trim());
    setEditingId(null);
  };

  const openCreate = () => {
    setNewName('');
    setNewPrivate(true);
    setCreating(true);
  };
  const create = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateCollection(trimmed, newPrivate);
    setCreating(false);
  };

  return (
    <main className="app-shell">
      <section className="phone profile-screen" aria-label="Profile">
        <div className="profile-scroll">
          <header className="profile-header">
            <div className="profile-avatar"><Icon name="user" size={27} /></div>
            <div><p>YOUR PROFILE</p><h1>{name}</h1></div>
            <button aria-label="Profile settings" onClick={onOpenSettings}><Icon name="cog" size={20} /></button>
          </header>

          <div className="profile-tabs" role="tablist">
            <button role="tab" aria-selected={profileTab === 'collections'} className={profileTab === 'collections' ? 'active' : ''} onClick={() => setProfileTab('collections')}>Collections</button>
            <button role="tab" aria-selected={profileTab === 'purchased'} className={profileTab === 'purchased' ? 'active' : ''} onClick={() => setProfileTab('purchased')}>Purchased</button>
          </div>

          {profileTab === 'collections' ? (
            <section className="collections-grid">
              {collections.map((c) => {
                const count = collectionCount(c);
                const covers = tilesOf(c).slice(0, 2).map((t) => t.item.image);
                const layout = c.id === LIKED_ID ? 'favorites-cover' : covers.length > 1 ? 'split-cover' : '';
                return (
                  <button key={c.id} className="collection-card" onClick={() => onOpenCollection(c.id)} aria-label={`Open ${c.name}`}>
                    <div className={`collection-cover ${layout}`}>
                      {covers.length === 0 && <span className="cover-empty"><Icon name="bookmark" size={22} /></span>}
                      {covers.map((src) => <img key={src} src={src} alt="" />)}
                      {c.id === LIKED_ID && <span><Icon name="heart" size={18} filled /></span>}
                    </div>
                    <h2>{c.name}</h2>
                    <p>{count} {count === 1 ? 'piece' : 'pieces'} · {c.isPrivate ? 'Private' : 'Public'}</p>
                  </button>
                );
              })}
              <button className="new-collection" onClick={openCreate}><span>+</span><strong>New collection</strong></button>
            </section>
          ) : (
            <section className="purchased-list" aria-label="Purchased items">
              {PURCHASES.length === 0 ? (
                <div className="saved-empty">
                  <span><Icon name="gift" size={26} /></span>
                  <h2>No purchases yet</h2>
                  <p>Things you buy will show up here so you can review them.</p>
                  <button onClick={() => onNav('discover')}>Explore pieces</button>
                </div>
              ) : (
                PURCHASES.map((p) => {
                  const item = findProduct(p.itemId);
                  if (!item) return null;
                  const mine = myReviews[item.id];
                  const editing = editingId === item.id;
                  return (
                    <article key={p.id} className="purchase-card">
                      <div className="purchase-top">
                        <img src={item.image} alt={item.alt} style={{ objectPosition: item.focus }} />
                        <div className="purchase-info">
                          <small>{item.brand}</small>
                          <h2>{item.title}</h2>
                          <p>{item.description}</p>
                          <div className="purchase-meta"><strong>{money(p.pricePaid)}</strong><span>Bought {p.purchasedOn}</span></div>
                        </div>
                      </div>

                      {editing ? (
                        <form
                          className="review-composer"
                          onSubmit={(e) => {
                            e.preventDefault();
                            postReview(item.id);
                          }}
                        >
                          <StarPicker value={rating} onChange={setRating} />
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="How was the fit, quality, feel?"
                            aria-label="Your review"
                            rows={3}
                            maxLength={400}
                          />
                          <div className="composer-actions">
                            <button type="button" className="pill-btn ghost" onClick={() => setEditingId(null)}>Cancel</button>
                            <button type="submit" className="pill-btn" disabled={!rating}>{mine ? 'Update' : 'Post'}</button>
                          </div>
                        </form>
                      ) : mine ? (
                        <div className="my-review">
                          <div className="my-review-head">
                            <span>Your review</span>
                            <button onClick={() => startReview(item.id)}>Edit</button>
                          </div>
                          <Stars rating={mine.rating} size={15} />
                          {mine.text && <p>{mine.text}</p>}
                        </div>
                      ) : (
                        <button className="leave-review" onClick={() => startReview(item.id)}>
                          <Icon name="star" size={16} />Leave a rating &amp; review
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          )}
        </div>
        <BottomSheet
          open={creating}
          onClose={() => setCreating(false)}
          label="New collection"
          height="50%"
          title={<div><h2>New collection</h2></div>}
        >
          <form
            className="edit-body"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <label className="edit-field">
              <span>Name</span>
              <input
                autoFocus
                value={newName}
                maxLength={40}
                placeholder="e.g. Fall wishlist"
                onChange={(e) => setNewName(e.target.value)}
                aria-label="Collection name"
              />
            </label>

            <div className="edit-row">
              <div>
                <strong>{newPrivate ? 'Private' : 'Public'}</strong>
                <small>{newPrivate ? 'Only you can see this collection.' : 'Anyone with the link can see it.'}</small>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={newPrivate}
                aria-label="Private"
                className={`switch ${newPrivate ? 'on' : ''}`}
                onClick={() => setNewPrivate((v) => !v)}
              ><span /></button>
            </div>

            <button type="submit" className="sheet-save" disabled={!newName.trim()}>Create collection</button>
          </form>
        </BottomSheet>

        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
