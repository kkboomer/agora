/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';

const friends = [
  { name: 'Maya Chen', tag: '@mayawears', initial: 'M', color: '#aa7058', note: '14 collections' },
  { name: 'Alex Morgan', tag: '@alexm', initial: 'A', color: '#647277', note: '9 collections' },
  { name: 'Sofia Reyes', tag: '@sofiar', initial: 'S', color: '#82715f', note: '22 collections' },
  { name: 'Noah Williams', tag: '@noahw', initial: 'N', color: '#6e7562', note: '7 collections' },
  { name: 'Camille Park', tag: '@camillep', initial: 'C', color: '#9a6d72', note: '11 collections' },
];

const img = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=${w}`;

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  name: string;
  handle: string;
}

export default function FriendsScreen({ nav, onNav, name, handle }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const friend = friends.find((f) => f.name === selected);

  return (
    <main className="app-shell">
      <section className="phone friends-screen" aria-label="Friends">
        <div className="friends-scroll">
          {friend ? (
            <>
              <header className="friend-profile-header">
                <button onClick={() => setSelected(null)} aria-label="Back to friends"><Icon name="back" /></button>
                <div className="large-friend-avatar" style={{ background: friend.color }}>{friend.initial}</div>
                <h1>{friend.name}</h1><p>{friend.tag}</p>
              </header>
              <div className="friend-profile-title"><span>COLLECTIONS</span><h2>Saved by {friend.name.split(' ')[0]}</h2></div>
              <section className="collections-grid friend-collections">
                <article className="collection-card">
                  <div className="collection-cover favorites-cover">
                    <img src={img('1613915617430-8ab0fd7c6baf', 400)} alt="" />
                    <img src={img('1762605135012-56a59a059e60', 400)} alt="" />
                    <span><Icon name="heart" size={18} filled /></span>
                  </div>
                  <h2>Liked items</h2><p>18 pieces</p>
                </article>
                <article className="collection-card">
                  <div className="collection-cover"><img src={img('1692180142575-c31fcd106b5b', 500)} alt="" /></div>
                  <h2>City layers</h2><p>12 pieces</p>
                </article>
                <article className="collection-card">
                  <div className="collection-cover"><img src={img('1659522761084-79196b64abe4', 500)} alt="" /></div>
                  <h2>For later</h2><p>7 pieces</p>
                </article>
              </section>
            </>
          ) : (
            <>
              <header className="friends-header">
                <div><p>YOUR CIRCLE</p><h1>{name}</h1><span>{handle} · AGORA-2841</span></div>
                <button aria-label="Add friends"><Icon name="userPlus" size={23} /></button>
              </header>
              <div className="friends-heading"><div><span>FRIENDS</span><h2>Your circle</h2></div><small>{friends.length} friends</small></div>
              <section className="friends-list">
                {friends.map((item) => (
                  <button key={item.name} className="friend-row" onClick={() => setSelected(item.name)}>
                    <span className="list-avatar" style={{ background: item.color }}>{item.initial}</span>
                    <span className="friend-identity"><strong>{item.name}</strong><small>{item.tag} · {item.note}</small></span>
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
