'use client';

import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import { PEOPLE, type Friend } from '@/lib/friends';

interface Props {
  open: boolean;
  onClose: () => void;
  friends: Friend[];
  onAdd: (friend: Friend) => void;
}

/** Find people by name or @tag and add them straight away: no request, no approval. */
export default function FriendSearchSheet({ open, onClose, friends, onAdd }: Props) {
  const [query, setQuery] = useState('');
  // People added during this visit stay listed (as "Added") instead of vanishing.
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setAdded([]);
    }
  }, [open]);

  const q = query.trim().toLowerCase().replace(/^@/, '');
  const isFriend = (tag: string) => friends.some((f) => f.tag === tag);
  const results = PEOPLE.filter(
    (p) => (!isFriend(p.tag) || added.includes(p.tag)) && (!q || p.name.toLowerCase().includes(q) || p.tag.slice(1).toLowerCase().includes(q)),
  );

  return (
    <BottomSheet open={open} onClose={onClose} label="Find friends" height="70%" title={<div><h2>Find friends</h2></div>}>
      <form className="friend-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="search" size={18} />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or @tag" aria-label="Search for friends" />
      </form>
      <ul className="coll-list">
        {results.length === 0 && (
          <li className="friend-search-empty">{q ? `No one found for “${query.trim()}”.` : 'You’re already friends with everyone here.'}</li>
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
