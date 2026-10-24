'use client';

import BottomSheet from './BottomSheet';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onSignIn: () => void;
  /** What they were trying to do, e.g. "create collections". */
  action: string;
}

/** Shown when a guest tries something that needs an account. */
export default function SignInSheet({ open, onClose, onSignIn, action }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Sign in required" height="44%" title={<div><h2>Sign in to continue</h2></div>}>
      <div className="edit-body signin-body">
        <span className="signin-icon"><Icon name="user" size={26} /></span>
        <p>Log in or create an account to {action}.</p>
        <button type="button" className="sheet-save" onClick={onSignIn}>Log in / Sign up</button>
        <button type="button" className="sheet-cancel" onClick={onClose}>Not now</button>
      </div>
    </BottomSheet>
  );
}
