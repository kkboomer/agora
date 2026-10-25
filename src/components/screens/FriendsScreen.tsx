/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Stars from '@/components/ui/Stars';
import FriendSearchSheet from '@/components/ui/FriendSearchSheet';
import BottomSheet from '@/components/ui/BottomSheet';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import CollectionScreen from '@/components/screens/CollectionScreen';
import type { Variant } from '@/components/ui/ProductSheet';
import { collectionCount, tilesOf, type Collection } from '@/lib/collections';
import type { Friend } from '@/lib/friends';
import type { Review } from '@/lib/reviews';
import { findProduct } from '@/lib/discoverFeed';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  name: string;
  handle: string;
  friends: Friend[];
  onUnfriend: (tag: string) => void;
  onAddFriend: (friend: Friend) => void | Promise<void>;
  onSearchPeople: (query: string) => Promise<Friend[]>;
  onAddToCart: (itemId: string, variant: Variant) => void;
  cartCount: number;
  onOpenCart: () => void;
  isLiked: (itemId: string) => boolean;
  onToggleLike: (itemId: string) => void;
  guest?: boolean;
  onSignIn: () => void;
  /** Everyone's reviews (from the database), so a friend's can be listed on their page. */
  reviews: Review[];
}

export default function FriendsScreen({ nav, onNav, name, handle, friends, onUnfriend, onAddFriend, onSearchPeople, onAddToCart, cartCount, onOpenCart, isLiked, onToggleLike, guest = false, onSignIn, reviews }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [friendTab, setFriendTab] = useState<'collections' | 'reviews'>('collections');
  const [viewing, setViewing] = useState<Collection | null>(null);
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);
  const [finding, setFinding] = useState(false);
  if (guest) {
    return (
      <main className="app-shell">
        <section className="phone friends-screen" aria-label="Friends">
          <div className="friends-scroll">
            <header className="friends-header">
              <div><p>YOUR CIRCLE</p><h1>Friends</h1></div>
            </header>
            <div className="saved-empty friends-signed-out">
              <span><Icon name="userPlus" size={26} /></span>
              <h2>Log in to see your friends</h2>
              <p>Add friends, browse their collections and see what they’re into.</p>
              <button onClick={onSignIn}>Log in / Sign up</button>
            </div>
          </div>
          <BottomNav current={nav} onChange={onNav} variant="home" />
        </section>
      </main>
    );
  }

  const friend = friends.find((f) => f.name === selected);
  if (friend && viewing) {
    return (
      <CollectionScreen
        nav={nav}
        onNav={onNav}
        onBack={() => setViewing(null)}
        collection={viewing}
        readOnly
        ownerName={friend.name.split(' ')[0]}
        onAddToCart={onAddToCart}
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        isLiked={isLiked}
        onToggleLike={onToggleLike}
      />
    );
  }

  const friendReviews = friend ? reviews.filter((r) => r.user === friend.tag.slice(1)) : [];

  return (
    <main className="app-shell">
      <section className="phone friends-screen" aria-label="Friends">
        <div className="friends-scroll">
          {friend ? (
            <>
              <header className="friend-profile-header">
                <button onClick={() => { setSelected(null); setFriendTab('collections'); }} aria-label="Back to friends"><Icon name="back" /></button>
                <div className="large-friend-avatar" style={{ background: friend.color }}>{friend.initial}</div>
                <button className="friend-more" onClick={() => setConfirmUnfriend(true)} aria-label={`Unfriend ${friend.name}`}><Icon name="userMinus" size={20} /></button>
                <h1>{friend.name}</h1><p>{friend.tag}</p>
              </header>
              <div className="profile-tabs" role="tablist">
                <button role="tab" aria-selected={friendTab === 'collections'} className={friendTab === 'collections' ? 'active' : ''} onClick={() => setFriendTab('collections')}>Collections</button>
                <button role="tab" aria-selected={friendTab === 'reviews'} className={friendTab === 'reviews' ? 'active' : ''} onClick={() => setFriendTab('reviews')}>Reviews</button>
              </div>
              {friendTab === 'reviews' ? (
                <section className="friend-reviews" aria-label={`Reviews left by ${friend.name}`}>
                  {friendReviews.length === 0 ? (
                    <div className="saved-empty">
                      <span><Icon name="star" size={26} /></span>
                      <h2>No reviews yet</h2>
                      <p>{friend.name.split(' ')[0]} hasn’t reviewed anything.</p>
                    </div>
                  ) : (
                    friendReviews.map((r) => {
                      const product = findProduct(r.itemId);
                      if (!product) return null;
                      return (
                        <article key={r.id} className="friend-review">
                          <img src={product.image} alt="" style={{ objectPosition: product.focus }} />
                          <div>
                            <small>{product.brand}</small>
                            <h2>{product.title}</h2>
                            <div className="friend-review-stars"><Stars rating={r.rating} size={13} /><span>{r.when} ago</span></div>
                            <p>{r.text}</p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>
              ) : (
              <section className="collections-grid friend-collections">
                {friend.collections.map((c) => {
                  const count = collectionCount(c);
                  const covers = tilesOf(c).slice(0, 2).map((t) => t.item.image);
                  const liked = c.name === 'Liked items';
                  return (
                    <button key={c.id} className="collection-card" onClick={() => setViewing(c)} aria-label={`Open ${c.name}`}>
                      <div className={`collection-cover ${liked ? 'favorites-cover' : covers.length > 1 ? 'split-cover' : ''}`}>
                        {covers.map((src) => <img key={src} src={src} alt="" />)}
                        {liked && <span><Icon name="heart" size={18} filled /></span>}
                      </div>
                      <h2>{c.name}</h2><p>{count} {count === 1 ? 'piece' : 'pieces'}</p>
                    </button>
                  );
                })}
              </section>
              )}
            </>
          ) : (
            <>
              <header className="friends-header">
                <div><p>YOUR CIRCLE</p><h1>{name}</h1><span>{handle}</span></div>
                <button aria-label="Find friends" onClick={() => setFinding(true)}><Icon name="userPlus" size={23} /></button>
              </header>
              <div className="friends-heading"><div><span>FRIENDS</span><h2>Your circle</h2></div><small>{friends.length} friends</small></div>
              <section className="friends-list">
                {friends.length === 0 && (
                  <div className="saved-empty">
                    <span><Icon name="userPlus" size={26} /></span>
                    <h2>No friends yet</h2>
                    <p>Share your tag so friends can find you.</p>
                  </div>
                )}
                {friends.map((item) => (
                  <button key={item.name} className="friend-row" onClick={() => { setSelected(item.name); setFriendTab('collections'); }}>
                    <span className="list-avatar" style={{ background: item.color }}>{item.initial}</span>
                    <span className="friend-identity"><strong>{item.name}</strong><small>{item.tag} · {item.collections.length} collections</small></span>
                    <Icon name="arrow" size={18} />
                  </button>
                ))}
              </section>
            </>
          )}
        </div>
        {friend && (
          <BottomSheet
            open={confirmUnfriend}
            onClose={() => setConfirmUnfriend(false)}
            label={`Unfriend ${friend.name}`}
            height="38%"
            title={<div><h2>Unfriend {friend.name.split(' ')[0]}?</h2></div>}
          >
            <div className="edit-body">
              <p className="unfriend-note">
                You’ll stop seeing {friend.name.split(' ')[0]}’s collections and reviews, and they’ll disappear from your circle. You can add each other again later.
              </p>
              <button
                className="sheet-danger"
                onClick={() => {
                  onUnfriend(friend.tag);
                  setConfirmUnfriend(false);
                  setSelected(null);
                  setFriendTab('collections');
                }}
              >
                Unfriend
              </button>
              <button className="sheet-cancel" onClick={() => setConfirmUnfriend(false)}>Cancel</button>
            </div>
          </BottomSheet>
        )}

        <FriendSearchSheet open={finding} onClose={() => setFinding(false)} friends={friends} onAdd={onAddFriend} onSearch={onSearchPeople} />
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
