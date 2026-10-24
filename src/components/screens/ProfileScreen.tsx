/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import type { DiscoverItem } from '@/lib/discoverFeed';
import type { Collection, Product } from '@/types/types';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  savedItems: DiscoverItem[];
  collections: (Collection & { items: { product: Product }[] })[];
  name: string;
  onOpenSettings: () => void;
}

export default function ProfileScreen({ nav, onNav, savedItems, collections, name, onOpenSettings }: Props) {
  const [profileTab, setProfileTab] = useState<'collections' | 'saved'>('collections');
  const orderedCollections = [...collections].sort((a, b) => Number(b.name === 'Liked items') - Number(a.name === 'Liked items'));

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
            <button role="tab" aria-selected={profileTab === 'saved'} className={profileTab === 'saved' ? 'active' : ''} onClick={() => setProfileTab('saved')}>Saved</button>
          </div>

          {profileTab === 'collections' ? (
            <section className="collections-grid">
              {orderedCollections.map((collection) => (
                <article className="collection-card" key={collection.id}>
                  <div className={`collection-cover ${collection.name === 'Liked items' ? 'favorites-cover' : collection.items.length > 1 ? 'split-cover' : ''}`}>
                    {collection.items.slice(0, 2).map((item) => <img key={item.product.id} src={item.product.image_url} alt="" />)}
                    {collection.name === 'Liked items' && <span><Icon name="heart" size={18} filled /></span>}
                  </div>
                  <h2>{collection.name}</h2>
                  <p>{collection.items.length} pieces · {collection.is_public ? 'Public' : 'Private'}</p>
                </article>
              ))}
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
