/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef, useState } from 'react';
import { toSquareWebp } from '@/lib/avatar';
import Icon from '@/components/ui/Icon';
import BottomSheet from '@/components/ui/BottomSheet';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  onBack: () => void;
  name: string;
  handle: string;
  photo: string | null;
  /** Resolves true when saved. A null image removes the photo. */
  onChangePhoto: (image: Blob | null) => Promise<boolean>;
  onChangeName: (name: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
  /** Not signed in: only dark mode, plus a way to log in. */
  guest?: boolean;
  onSignIn: () => void;
}

export default function SettingsScreen({ nav, onNav, onBack, name, handle, photo, onChangePhoto, onChangeName, darkMode, onToggleDark, onLogout, guest = false, onSignIn }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [picked, setPicked] = useState<{ blob: Blob; preview: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const closePhoto = () => {
    if (picked) URL.revokeObjectURL(picked.preview);
    setPicked(null);
    setPhotoError(null);
    setPhotoOpen(false);
  };
  const openPhoto = () => {
    setPicked(null);
    setPhotoError(null);
    setPhotoOpen(true);
  };
  const choose = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    try {
      const blob = await toSquareWebp(file);
      if (picked) URL.revokeObjectURL(picked.preview);
      setPicked({ blob, preview: URL.createObjectURL(blob) });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Couldn’t use that image.');
    }
  };
  const submit = async (image: Blob | null) => {
    setBusy(true);
    setPhotoError(null);
    const ok = await onChangePhoto(image);
    setBusy(false);
    if (ok) closePhoto();
    else setPhotoError('Couldn’t save your photo. Try again.');
  };

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
            <button className="settings-avatar" onClick={guest ? undefined : openPhoto} disabled={guest} aria-label={guest ? 'Profile photo' : 'Edit profile photo'}>
              {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : <Icon name="user" size={40} />}
              {!guest && <span className="avatar-edit"><Icon name="edit" size={14} /></span>}
            </button>
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

            {guest && (
              <li>
                <button className="settings-row" onClick={onSignIn}>
                  <span className="settings-icon"><Icon name="user" size={19} /></span>
                  <span className="settings-label">Log in or sign up</span>
                  <Icon name="arrow" size={16} />
                </button>
              </li>
            )}

            {!guest && <li>
              <button className="settings-row" onClick={openPhoto}>
                <span className="settings-icon"><Icon name="user" size={19} /></span>
                <span className="settings-label">Edit profile photo</span>
                <Icon name="arrow" size={16} />
              </button>
            </li>}

            {!guest && <li>
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
            </li>}

            {!guest && <li>
              <button className="settings-row danger" onClick={() => setConfirmLogout(true)}>
                <span className="settings-icon"><Icon name="logout" size={19} /></span>
                <span className="settings-label">Log out</span>
              </button>
            </li>}
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

        <BottomSheet open={photoOpen} onClose={closePhoto} label="Edit profile photo" height="58%" title={<div><h2>Profile photo</h2></div>}>
          <div className="edit-body">
            <div className="photo-preview">
              {picked || photo ? <img src={picked?.preview ?? photo ?? ''} alt="Profile photo preview" referrerPolicy="no-referrer" /> : <Icon name="user" size={38} />}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className="sheet-cancel" onClick={() => fileRef.current?.click()}>{picked || photo ? 'Choose a different photo' : 'Choose a photo'}</button>
            {photoError && <p className="promo-error" role="alert">{photoError}</p>}
            <button type="button" className="sheet-save" disabled={!picked || busy} onClick={() => picked && submit(picked.blob)}>{busy ? 'Saving…' : 'Save photo'}</button>
            {photo && !picked && (
              <button type="button" className="sheet-cancel" disabled={busy} onClick={() => submit(null)}>Remove photo</button>
            )}
          </div>
        </BottomSheet>

        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
