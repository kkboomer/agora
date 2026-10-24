/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import { LIKED_ID, type Collection } from '@/lib/collections';
import { DISCOVER_ITEMS, type DiscoverItem } from '@/lib/discoverFeed';

interface Props {
  item: DiscoverItem;
  collections: Collection[];
  open: boolean;
  onClose: () => void;
  onToggle: (collectionId: string) => void;
  onCreate: (name: string) => void;
}

const coverOf = (c: Collection) => c.covers?.[0] ?? DISCOVER_ITEMS.find((i) => i.id === c.itemIds[0])?.image;

/** Half-height sheet for adding an item to Liked, one of your collections, or a brand-new one. */
export default function CollectionSheet({ item, collections, open, onClose, onToggle, onCreate }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const close = () => {
    setCreating(false);
    setName('');
    onClose();
  };
  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setCreating(false);
    setName('');
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      label={`Save ${item.title} to a collection`}
      height="52%"
      title={<div><h2>Save to collection</h2><p className="sheet-sub">{item.title}</p></div>}
    >
      <ul className="coll-list">
        {collections.map((c) => {
          const inIt = c.itemIds.includes(item.id);
          const cover = coverOf(c);
          return (
            <li key={c.id}>
              <button className="coll-row" aria-pressed={inIt} onClick={() => onToggle(c.id)}>
                <span className="coll-thumb">
                  {cover ? <img src={cover} alt="" /> : <Icon name="bookmark" size={18} />}
                  {c.id === LIKED_ID && <span className="coll-heart"><Icon name="heart" size={10} filled /></span>}
                </span>
                <span className="coll-name">
                  <strong>{c.name}</strong>
                  <small>{c.baseCount + c.itemIds.length} pieces · Private</small>
                </span>
                <span className={`coll-check ${inIt ? 'on' : ''}`}>{inIt && <Icon name="check" size={14} />}</span>
              </button>
            </li>
          );
        })}

        <li>
          {creating ? (
            <form
              className="coll-new-form"
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your collection"
                aria-label="New collection name"
              />
              <button type="button" className="pill-btn ghost" onClick={() => { setCreating(false); setName(''); }}>Cancel</button>
              <button type="submit" className="pill-btn" disabled={!name.trim()}>Create</button>
            </form>
          ) : (
            <button className="coll-row coll-new" onClick={() => setCreating(true)}>
              <span className="coll-thumb plus"><Icon name="plus" size={20} /></span>
              <span className="coll-name"><strong>New collection</strong><small>Create one and add this piece</small></span>
            </button>
          )}
        </li>
      </ul>
    </BottomSheet>
  );
}
