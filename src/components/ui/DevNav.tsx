'use client';

import { useState } from 'react';

export type DevScreen = 'discover' | 'home' | 'search' | 'profile' | 'gifts' | 'settings' | 'cart';

const screens: { id: DevScreen; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'home', label: 'Home' },
  { id: 'search', label: 'Browse / Search' },
  { id: 'profile', label: 'Profile' },
  { id: 'gifts', label: 'Friends' },
  { id: 'cart', label: 'Cart' },
  { id: 'settings', label: 'Settings' },
];

interface Props {
  current: DevScreen;
  onGo: (screen: DevScreen) => void;
}

/** Dev-only screen switcher. Fixed to the viewport corner, outside the phone frame. */
export default function DevNav({ current, onGo }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dev-nav">
      {open && (
        <ul className="dev-nav-menu" role="menu">
          {screens.map((s) => (
            <li key={s.id} role="none">
              <button role="menuitem" className={current === s.id ? 'active' : ''} onClick={() => onGo(s.id)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="dev-nav-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle dev screen navigation">
        DEV {open ? '×' : '☰'}
      </button>
    </div>
  );
}
