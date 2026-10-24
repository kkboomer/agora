/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';

export interface SignUpDetails {
  name: string;
  /** Without the leading @ */
  username: string;
  email: string;
  password: string;
}

interface Props {
  /** Each resolves to an error message to show, or null when it worked. */
  onLogin: (identifier: string, password: string) => Promise<string | null>;
  onSignUp: (details: SignUpDetails) => Promise<string | null>;
  onGuest: () => void;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9_.]{3,20}$/;

function Logo() {
  return (
    <div className="auth-logo">
      <img className="mark-light" src="/agora-mark-white.svg" alt="" />
      <img className="mark-dark" src="/agora-mark.svg" alt="" />
      <h1>Agora</h1>
    </div>
  );
}

function PasswordField({ value, onChange, label = 'Password', autoComplete }: { value: string; onChange: (v: string) => void; label?: string; autoComplete: string }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className="auth-input">
        <input type={shown ? 'text' : 'password'} value={value} autoComplete={autoComplete} placeholder="At least 6 characters" onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide password' : 'Show password'}>{shown ? 'Hide' : 'Show'}</button>
      </div>
    </label>
  );
}

/** First screen: log in, sign up for an account, or carry on as a guest. UI only; nothing is verified yet. */
export default function AuthScreen({ onLogin, onSignUp, onGuest }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const switchTo = (next: 'login' | 'signup') => {
    setError(null);
    setMode(next);
  };

  // Runs a request with the busy state, showing whatever error comes back.
  const run = async (request: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const message = await request();
    setBusy(false);
    if (message) setError(message);
  };

  const submitLogin = () => {
    if (!loginId.trim() || !loginPw) return setError('Enter your email or @username and password.');
    run(() => onLogin(loginId, loginPw));
  };
  const submitSignUp = () => {
    if (!name.trim()) return setError('Add your name.');
    if (!HANDLE.test(handle)) return setError('Usernames are 3–20 letters, numbers, . or _');
    if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.');
    if (pw.length < 6) return setError('Password needs at least 6 characters.');
    run(() => onSignUp({ name: name.trim(), username: handle, email: email.trim(), password: pw }));
  };

  return (
    <main className="app-shell">
      <section className="phone auth-screen" aria-label={mode === 'login' ? 'Log in' : 'Create account'}>
        <div className="auth-scroll">
          <Logo />

          {mode === 'login' ? (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitLogin();
              }}
            >
              <h2>Welcome back</h2>
              <label className="auth-field">
                <span>Email or @username</span>
                <div className="auth-input"><input value={loginId} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" onChange={(e) => setLoginId(e.target.value)} /></div>
              </label>
              <PasswordField value={loginPw} onChange={setLoginPw} autoComplete="current-password" />
              {error && <p className="promo-error auth-error" role="alert">{error}</p>}
              <button type="submit" className="auth-primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
              <p className="auth-switch">New to Agora? <button type="button" onClick={() => switchTo('signup')}>Sign up</button></p>
              <div className="auth-divider"><span>or</span></div>
              <button type="button" className="auth-guest" onClick={onGuest}>Continue as guest</button>
            </form>
          ) : (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitSignUp();
              }}
            >
              <h2>Create your account</h2>
              <label className="auth-field">
                <span>Name</span>
                <div className="auth-input"><input value={name} maxLength={40} autoComplete="name" placeholder="Your name" onChange={(e) => setName(e.target.value)} /></div>
              </label>
              <label className="auth-field">
                <span>Username</span>
                <div className="auth-input">
                  <em>@</em>
                  <input
                    value={handle}
                    maxLength={20}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="username"
                    onChange={(e) => setHandle(e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  />
                </div>
              </label>
              <label className="auth-field">
                <span>Email</span>
                <div className="auth-input"><input type="email" value={email} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} /></div>
              </label>
              <PasswordField value={pw} onChange={setPw} autoComplete="new-password" />
              {error && <p className="promo-error auth-error" role="alert">{error}</p>}
              <button type="submit" className="auth-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
              <p className="auth-switch">Already have an account? <button type="button" onClick={() => switchTo('login')}>Log in</button></p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
