/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import { LIKED_ID, collectionCount, tilesOf, type Collection } from '@/lib/collections';
import type { DiscoverItem } from '@/lib/discoverFeed';

interface Props {
  item: DiscoverItem;
  collections: Collection[];
  open: boolean;
  onClose: () => void;
  onToggle: (collectionId: string) => void;
  onCreate: (name: string, isPrivate: boolean) => void;
  /** Guests can't make collections: tapping New collection calls this instead. */
  onBlockedCreate?: () => void;
}

const coverOf = (c: Collection) => tilesOf(c)[0]?.item.image;

/** Half-height sheet for adding an item to Liked, one of your collections, or a brand-new one. */
export default function CollectionSheet({ item, collections, open, onClose, onToggle, onCreate, onBlockedCreate }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const resetNew = () => {
    setCreating(false);
    setName('');
    setIsPrivate(true);
  };
  const close = () => {
    resetNew();
    onClose();
  };
  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, isPrivate);
    resetNew();
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={close}
        label={`Save ${item.title} to a collection`}
        height="52%"
        title={
          <div>
            <h2>Save to collection</h2>
            <p className="sheet-sub">{item.title}</p>
          </div>
        }
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
                    {c.id === LIKED_ID && (
                      <span className="coll-heart">
                        <Icon name="heart" size={10} filled />
                      </span>
                    )}
                  </span>
                  <span className="coll-name">
                    <strong>{c.name}</strong>
                    <small>
                      {collectionCount(c)} {collectionCount(c) === 1 ? 'piece' : 'pieces'} · {c.isPrivate ? 'Private' : 'Public'}
                    </small>
                  </span>
                  <span className={`coll-check ${inIt ? 'on' : ''}`}>{inIt && <Icon name="check" size={14} />}</span>
                </button>
              </li>
            );
          })}

          <li>
            <button className="coll-row coll-new" onClick={() => (onBlockedCreate ? onBlockedCreate() : setCreating(true))}>
              <span className="coll-thumb plus">
                <Icon name="plus" size={20} />
              </span>
              <span className="coll-name">
                <strong>New collection</strong>
                <small>Create one and add this piece</small>
              </span>
            </button>
          </li>
        </ul>
      </BottomSheet>

      <BottomSheet
        open={creating}
        onClose={resetNew}
        label="New collection"
        height="50%"
        title={
          <div>
            <h2>New collection</h2>
          </div>
        }
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
              value={name}
              maxLength={40}
              placeholder="e.g. Fall wishlist"
              onChange={(e) => setName(e.target.value)}
              aria-label="Collection name"
            />
          </label>

          <div className="edit-row">
            <div>
              <strong>{isPrivate ? 'Private' : 'Public'}</strong>
              <small>{isPrivate ? 'Only you can see this collection.' : 'Anyone with the link can see it.'}</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              aria-label="Private"
              className={`switch ${isPrivate ? 'on' : ''}`}
              onClick={() => setIsPrivate((v) => !v)}
            >
              <span />
            </button>
          </div>

          <button type="submit" className="sheet-save" disabled={!name.trim()}>
            Create and add piece
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
