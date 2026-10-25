'use client';

import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import type { Friend } from '@/lib/friends';

interface Props {
  open: boolean;
  onClose: () => void;
  friends: Friend[];
  onAdd: (friend: Friend) => void | Promise<void>;
  /** Queries the database for people matching the typed @username or name. */
  onSearch: (query: string) => Promise<Friend[]>;
}

/** Find people by name or @tag and add them straight away: no request, no approval. */
export default function FriendSearchSheet({ open, onClose, friends, onAdd, onSearch }: Props) {
  const [query, setQuery] = useState('');
  // People added during this visit stay listed (as "Added") instead of vanishing.
  const [added, setAdded] = useState<string[]>([]);

  const [found, setFound] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);

  // Parents pass a fresh function every render; a ref keeps the debounce from restarting.
  const search = useRef(onSearch);
  useEffect(() => {
    search.current = onSearch;
  });

  const q = query.trim().replace(/^@/, '');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setAdded([]);
      setFound([]);
    }
  }, [open]);

  // Look people up as you type (debounced), ignoring answers that arrive late.
  useEffect(() => {
    if (!open || !q) {
      setFound([]);
      setSearching(false);
      return;
    }
    let stale = false;
    setSearching(true);
    const t = setTimeout(() => {
      search.current(q)
        .then((r) => !stale && setFound(r))
        .catch(() => !stale && setFound([]))
        .finally(() => !stale && setSearching(false));
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [q, open]);

  const isFriend = (tag: string) => friends.some((f) => f.tag === tag);
  const results = found.filter((p) => !isFriend(p.tag) || added.includes(p.tag));

  return (
    <BottomSheet open={open} onClose={onClose} label="Find friends" height="70%" title={<div><h2>Find friends</h2></div>}>
      <form className="friend-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="search" size={18} />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or @tag" aria-label="Search for friends" />
      </form>
      <ul className="coll-list">
        {(results.length === 0 || (!q)) && (
          <li className="friend-search-empty">{!q ? 'Type a name or @username to find someone.' : searching ? 'Searching…' : `No one found for “${query.trim()}”.`}</li>
        )}
        {results.map((p) => {
          const done = added.includes(p.tag);
          return (
            <li key={p.tag}>
              <div className="coll-row friend-result">
                <span className="list-avatar" style={{ background: p.color }}>{p.initial}</span>
                <span className="coll-name"><strong>{p.name}</strong><small>{p.tag}</small></span>
                <button
                  type="button"
                  className={`add-friend-btn ${done ? 'done' : ''}`}
                  disabled={done}
                  onClick={() => {
                    onAdd(p);
                    setAdded((a) => [...a, p.tag]);
                  }}
                >
                  {done ? <><Icon name="check" size={14} />Added</> : <><Icon name="userPlus" size={14} />Add</>}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
