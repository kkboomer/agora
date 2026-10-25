'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import type { Friend } from '@/lib/friends';

export interface GiftProps {
  /** Obols up for gifting. The sheet is open while this is above 0. */
  amount: number;
  friends: Friend[];
  /** Resolves true when the gift went through. */
  onSend: (friend: Friend) => Promise<boolean>;
  /** Give up the gift. Also what closing the sheet does. */
  onToss: () => void;
  /** Where "Add friends" leads. */
  onFindFriends: () => void;
}

/** After a purchase: send the gift reward to a friend, or toss it. */
export default function GiftObolsSheet({ amount, friends, onSend, onToss, onFindFriends }: GiftProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ name: string; amount: number } | null>(null);

  const friend = friends.find((f) => f.tag === picked);
  const open = amount > 0 || sentTo !== null;

  const close = () => {
    const wasSent = sentTo !== null;
    setPicked(null);
    setError(null);
    setSentTo(null);
    if (!wasSent) onToss();
  };

  const send = async () => {
    if (!friend || busy) return;
    setBusy(true);
    setError(null);
    const ok = await onSend(friend);
    setBusy(false);
    if (ok) setSentTo({ name: friend.name.split(' ')[0], amount });
    else setError('Couldn’t send the gift. Try again.');
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      label="Gift obols to a friend"
      height="62%"
      title={<div><h2>{sentTo ? 'Gift sent' : 'Gift your obols'}</h2></div>}
    >
      {sentTo ? (
        <div className="saved-empty gift-done">
          <span><Icon name="gift" size={26} /></span>
          <h2>Sent to {sentTo.name}</h2>
          <p>{sentTo.name} just got {sentTo.amount} obols from you.</p>
          <button onClick={close}>Done</button>
        </div>
      ) : (
        <div className="gift-body">
          <p className="gift-intro">Your purchase came with <strong>{amount} gift obols</strong>. Send them to a friend, or toss them.</p>
          {friends.length === 0 ? (
            <div className="saved-empty">
              <span><Icon name="userPlus" size={26} /></span>
              <h2>No friends to send to yet</h2>
              <p>Add a friend and your next gift can go to them.</p>
              <button onClick={() => { close(); onFindFriends(); }}>Find friends</button>
            </div>
          ) : (
            <ul className="coll-list">
              {friends.map((f) => (
                <li key={f.tag}>
                  <button type="button" className={`coll-row gift-friend ${picked === f.tag ? 'picked' : ''}`} onClick={() => setPicked(f.tag)} aria-pressed={picked === f.tag}>
                    <span className="list-avatar" style={{ background: f.color }}>{f.initial}</span>
                    <span className="coll-name"><strong>{f.name}</strong><small>{f.tag}</small></span>
                    {picked === f.tag && <Icon name="check" size={18} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="promo-error" role="alert">{error}</p>}
          {friends.length > 0 && (
            <button className="sheet-save gift-send" disabled={!friend || busy} onClick={send}>
              {busy ? 'Sending…' : friend ? `Send ${amount} obols to ${friend.name.split(' ')[0]}` : 'Choose a friend'}
            </button>
          )}
          <button className="sheet-cancel" onClick={close}>Toss them</button>
        </div>
      )}
    </BottomSheet>
  );
}
