/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { FriendWithCollections } from '@/types/types';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  friends: FriendWithCollections[];
}

export default function FriendsScreen({ nav, onNav, friends }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const friend = friends.find((f) => f.profile.id === selected);

  return (
    <main className="app-shell">
      <section className="phone friends-screen" aria-label="Friends">
        <div className="friends-scroll">
          {friend ? (
            <>
              <header className="friend-profile-header">
                <button onClick={() => setSelected(null)} aria-label="Back to friends"><Icon name="back" /></button>
                <div className="large-friend-avatar">{friend.profile.display_name[0]}</div>
                <h1>{friend.profile.display_name}</h1><p>@{friend.profile.username}</p>
              </header>
              <div className="friend-profile-title"><span>COLLECTIONS</span><h2>Saved by {friend.profile.display_name.split(' ')[0]}</h2></div>
              <section className="collections-grid friend-collections">
                {friend.collections.map((collection) => (
                  <article className="collection-card" key={collection.id}>
                    <div className={`collection-cover ${collection.items.length > 1 ? 'split-cover' : ''}`}>
                      {collection.items.slice(0, 2).map((item) => <img key={item.product.id} src={item.product.image_url} alt="" />)}
                      {collection.name === 'Liked items' && <span><Icon name="heart" size={18} filled /></span>}
                    </div>
                    <h2>{collection.name}</h2><p>{collection.items.length} pieces</p>
                  </article>
                ))}
              </section>
            </>
          ) : (
            <>
              <header className="friends-header">
                <div><p>YOUR CIRCLE</p><h1>Alex Rivera</h1><span>@alex_cal · AGORA-2841</span></div>
                <button aria-label="Add friends"><Icon name="userPlus" size={23} /></button>
              </header>
              <div className="friends-heading"><div><span>FRIENDS</span><h2>Your circle</h2></div><small>{friends.length} friends</small></div>
              <section className="friends-list">
                {friends.map((item) => (
                  <button key={item.profile.id} className="friend-row" onClick={() => setSelected(item.profile.id)}>
                    <span className="list-avatar">{item.profile.display_name[0]}</span>
                    <span className="friend-identity"><strong>{item.profile.display_name}</strong><small>@{item.profile.username} · {item.collections.length} collections</small></span>
                    <Icon name="arrow" size={18} />
                  </button>
                ))}
              </section>
              <div className="invite-card">
                <span><Icon name="userPlus" size={21} /></span>
                <div><h3>Grow your circle</h3><p>Share your tag so friends can find you.</p></div>
                <button>Invite</button>
              </div>
            </>
          )}
        </div>
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
