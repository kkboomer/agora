/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { DiscoverItem } from '@/lib/discoverFeed';

const img = (id: string, w: number, q = 82) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=${q}&w=${w}`;

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  savedItems: DiscoverItem[];
  likedCount: number;
}

export default function ProfileScreen({ nav, onNav, savedItems, likedCount }: Props) {
  const [profileTab, setProfileTab] = useState<'collections' | 'saved'>('collections');

  return (
    <main className="app-shell">
      <section className="phone profile-screen" aria-label="Profile">
        <div className="profile-scroll">
          <header className="profile-header">
            <div className="profile-avatar"><Icon name="user" size={27} /></div>
            <div><p>YOUR PROFILE</p><h1>Jordan Lee</h1></div>
            <button aria-label="Profile settings"><Icon name="sliders" size={20} /></button>
          </header>

          <div className="profile-tabs" role="tablist">
            <button role="tab" aria-selected={profileTab === 'collections'} className={profileTab === 'collections' ? 'active' : ''} onClick={() => setProfileTab('collections')}>Collections</button>
            <button role="tab" aria-selected={profileTab === 'saved'} className={profileTab === 'saved' ? 'active' : ''} onClick={() => setProfileTab('saved')}>Saved</button>
          </div>

          {profileTab === 'collections' ? (
            <section className="collections-grid">
              <article className="collection-card">
                <div className="collection-cover favorites-cover">
                  <img src={img('1762605135012-56a59a059e60', 500)} alt="" />
                  <img src={img('1613915617430-8ab0fd7c6baf', 400)} alt="" />
                  <span><Icon name="heart" size={18} filled /></span>
                </div>
                <h2>Liked items</h2>
                <p>{11 + likedCount} pieces · Private</p>
              </article>
              <article className="collection-card">
                <div className="collection-cover split-cover">
                  <img src={img('1692180142575-c31fcd106b5b', 400)} alt="" />
                  <img src={img('1603189343302-e603f7add05a', 400)} alt="" />
                </div>
                <h2>Everyday layers</h2>
                <p>8 pieces · Private</p>
              </article>
              <article className="collection-card">
                <div className="collection-cover"><img src={img('1659522761084-79196b64abe4', 600)} alt="" /></div>
                <h2>Occasion</h2>
                <p>5 pieces · Private</p>
              </article>
              <button className="new-collection"><span>+</span><strong>New collection</strong></button>
            </section>
          ) : (
            <section className={`saved-grid ${savedItems.length ? 'filled' : ''}`}>
              {savedItems.length > 0 ? (
                savedItems.map((it) => (
                  <article key={it.id}>
                    <img src={it.image} alt={it.alt} style={{ objectPosition: it.focus }} />
                    <small>{it.brand}</small><h2>{it.title}</h2><p>${it.price}</p>
                  </article>
                ))
              ) : (
                <div className="saved-empty">
                  <span><Icon name="bookmark" size={26} /></span>
                  <h2>Nothing saved yet</h2>
                  <p>Bookmark pieces in Discover to keep them here.</p>
                  <button onClick={() => onNav('discover')}>Explore pieces</button>
                </div>
              )}
            </section>
          )}
        </div>
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
