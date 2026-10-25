'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import { REWARDS, rewardForCode, type GiftEntry } from '@/lib/rewards';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  /** Not signed in: there are no obols to show. */
  guest?: boolean;
  onSignIn: () => void;
  /** The signed-in user's obol balance. */
  balance: number;
  /** Reward codes claimed and not used yet (one entry per claim). */
  claimed: string[];
  /** Spends obols on a reward. Resolves to an error message, or null when it worked. */
  onClaim: (rewardId: string) => Promise<string | null>;
  gifts: GiftEntry[];
  /** Reloads the balance and gift history. Called when the screen opens. */
  onRefresh: () => void;
}

const obols = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'obol' : 'obols'}`;

/** Rewards you can spend obols on, and the history of gifts sent and received. */
export default function GiftsScreen({ nav, onNav, guest = false, onSignIn, balance, claimed, onClaim, gifts, onRefresh }: Props) {
  const [tab, setTab] = useState<'rewards' | 'history'>('rewards');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claim = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setMessage(null);
    const error = await onClaim(id);
    setBusy(null);
    setMessage(error ? { text: error, ok: false } : { text: 'Claimed! Apply the code at checkout.', ok: true });
  };

  return (
    <main className="app-shell">
      <section className="phone friends-screen gifts-screen" aria-label="Gifts">
        <div className="friends-scroll">
          <header className="friends-header">
            <h1>Your Points</h1>
            {!guest && (
              <div className="points-balance" aria-label={`${balance} obols`}>
                <Icon name="coin" size={24} />
                <strong>{balance.toLocaleString('en-US')}</strong>
              </div>
            )}
          </header>

          {guest ? (
            <div className="saved-empty friends-signed-out">
              <span><Icon name="gift" size={26} /></span>
              <h2>Log in to earn obols</h2>
              <p>Earn obols when you buy, gift them to friends and spend them on rewards.</p>
              <button onClick={onSignIn}>Log in / Sign up</button>
            </div>
          ) : (
            <>
              <div className="profile-tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'rewards'} className={tab === 'rewards' ? 'active' : ''} onClick={() => setTab('rewards')}>Rewards</button>
                <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Gift history</button>
              </div>

              {tab === 'rewards' ? (
                <section className="rewards-list" aria-label="Rewards">
                  {message && <p className={message.ok ? 'reward-note' : 'promo-error'} role="status">{message.text}</p>}

                  {claimed.length > 0 && (
                    <div className="claimed-rewards">
                      <h2>Ready to use</h2>
                      {claimed.map((code, i) => (
                        <div key={`${code}-${i}`} className="claimed-row">
                          <span><Icon name="check" size={15} />{rewardForCode(code)?.title ?? code}</span>
                          <code>{code}</code>
                        </div>
                      ))}
                    </div>
                  )}

                  {REWARDS.map((r) => {
                    const short = r.cost - balance;
                    return (
                      <article key={r.id} className="reward-card">
                        <div className="reward-info">
                          <h3>{r.title}</h3>
                          <small>{short > 0 ? `${obols(short)} to go` : 'You have enough'}</small>
                        </div>
                        <button className="reward-claim" disabled={short > 0 || busy !== null} onClick={() => claim(r.id)}>
                          {busy === r.id ? 'Claiming…' : <>Claim<small>{obols(r.cost)}</small></>}
                        </button>
                      </article>
                    );
                  })}
                </section>
              ) : (
                <section className="gift-history" aria-label="Gift history">
                  {gifts.length === 0 ? (
                    <div className="saved-empty">
                      <span><Icon name="gift" size={26} /></span>
                      <h2>No gifts yet</h2>
                      <p>Buy something with a gift reward and send it to a friend. Gifts you send and get show up here.</p>
                    </div>
                  ) : (
                    gifts.map((g) => (
                      <article key={g.id} className={`gift-row ${g.direction}`}>
                        <span className="gift-icon"><Icon name="gift" size={18} /></span>
                        <div>
                          <strong>{g.direction === 'sent' ? `You gifted ${g.name}` : `${g.name} gifted you`}</strong>
                          <small>
                            {g.brand ? `from ${g.brand} · ` : ''}{g.when} ago
                          </small>
                        </div>
                        <b>{g.direction === 'sent' ? '' : '+'}{g.amount}</b>
                      </article>
                    ))
                  )}
                </section>
              )}
            </>
          )}
        </div>
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
