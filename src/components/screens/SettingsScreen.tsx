'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  onBack: () => void;
  name: string;
  handle: string;
  onChangeName: (name: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

export default function SettingsScreen({ nav, onNav, onBack, name, handle, onChangeName, darkMode, onToggleDark, onLogout }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };
  const saveName = () => {
    const next = draft.trim();
    if (next) onChangeName(next);
    setEditing(false);
  };

  return (
    <main className="app-shell">
      <section className="phone settings-screen" aria-label="Settings">
        <div className="settings-scroll">
          <header className="settings-top">
            <button className="header-action" onClick={onBack} aria-label="Back"><Icon name="back" size={21} /></button>
            <h1>Settings</h1>
            <span />
          </header>

          <div className="settings-profile">
            <div className="settings-avatar"><Icon name="user" size={40} /></div>
            <h2>{name}</h2>
            <p>{handle}</p>
          </div>

          <ul className="settings-list">
            <li>
              <div className="settings-row">
                <span className="settings-icon"><Icon name="moon" size={19} /></span>
                <span className="settings-label">Dark mode</span>
                <button
                  role="switch"
                  aria-checked={darkMode}
                  aria-label="Dark mode"
                  className={`switch ${darkMode ? 'on' : ''}`}
                  onClick={onToggleDark}
                ><span /></button>
              </div>
            </li>

            <li>
              {editing ? (
                <form
                  className="settings-row editing"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveName();
                  }}
                >
                  <span className="settings-icon"><Icon name="edit" size={19} /></span>
                  <input
                    autoFocus
                    value={draft}
                    maxLength={40}
                    aria-label="Display name"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
                  />
                  <button type="button" className="pill-btn ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="pill-btn" disabled={!draft.trim()}>Save</button>
                </form>
              ) : (
                <button className="settings-row" onClick={startEdit}>
                  <span className="settings-icon"><Icon name="edit" size={19} /></span>
                  <span className="settings-label">Edit name</span>
                  <span className="settings-value">{name}</span>
                  <Icon name="arrow" size={16} />
                </button>
              )}
            </li>

            <li>
              <button className="settings-row danger" onClick={() => setConfirmLogout(true)}>
                <span className="settings-icon"><Icon name="logout" size={19} /></span>
                <span className="settings-label">Log out</span>
              </button>
            </li>
          </ul>
        </div>

        {confirmLogout && (
          <div className="sheet-backdrop" onClick={() => setConfirmLogout(false)}>
            <div className="sheet" role="alertdialog" aria-label="Confirm log out" onClick={(e) => e.stopPropagation()}>
              <h3>Log out of Agora?</h3>
              <p>You can log back in any time.</p>
              <button className="sheet-primary" onClick={onLogout}>Log out</button>
              <button className="sheet-secondary" onClick={() => setConfirmLogout(false)}>Cancel</button>
            </div>
          </div>
        )}

        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
