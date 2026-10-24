/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Stars from '@/components/ui/Stars';
import StarPicker from '@/components/ui/StarPicker';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import { DISCOVER_ITEMS } from '@/lib/discoverFeed';
import { LIKED_ID, type Collection } from '@/lib/collections';
import { PURCHASES } from '@/lib/purchases';
import type { Review } from '@/lib/reviews';
import { money } from '@/components/screens/CartScreen';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  collections: Collection[];
  name: string;
  onOpenSettings: () => void;
  /** The signed-in user's reviews, keyed by item id. */
  myReviews: Record<string, Review>;
  onSaveReview: (itemId: string, rating: number, text: string) => void;
}

export default function ProfileScreen({ nav, onNav, collections, name, onOpenSettings, myReviews, onSaveReview }: Props) {
  const [profileTab, setProfileTab] = useState<'collections' | 'purchased'>('collections');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

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
                const covers = c.covers ?? c.itemIds.slice(0, 2).flatMap((id) => DISCOVER_ITEMS.find((i) => i.id === id)?.image ?? []);
                const layout = c.id === LIKED_ID ? 'favorites-cover' : covers.length > 1 ? 'split-cover' : '';
                return (
                  <article key={c.id} className="collection-card">
                    <div className={`collection-cover ${layout}`}>
                      {covers.length === 0 && <span className="cover-empty"><Icon name="bookmark" size={22} /></span>}
                      {covers.map((src) => <img key={src} src={src} alt="" />)}
                      {c.id === LIKED_ID && <span><Icon name="heart" size={18} filled /></span>}
                    </div>
                    <h2>{c.name}</h2>
                    <p>{c.baseCount + c.itemIds.length} {c.baseCount + c.itemIds.length === 1 ? 'piece' : 'pieces'} · Private</p>
                  </article>
                );
              })}
              <button className="new-collection"><span>+</span><strong>New collection</strong></button>
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
                  const item = DISCOVER_ITEMS.find((i) => i.id === p.itemId);
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
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
