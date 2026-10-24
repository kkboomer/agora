import { supabase, isSupabaseConfigured } from './client';

export interface AuthUser {
  id: string;
  name: string;
  /** Includes the leading @ */
  handle: string;
  avatarUrl: string | null;
}

const AVATAR_PATH = '/storage/v1/object/public/avatars/';

/** The signed-in user plus their profile row, or null when signed out. */
export async function currentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).maybeSingle();
  const username = profile?.username ?? user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'me';
  return {
    id: user.id,
    name: profile?.display_name ?? user.user_metadata?.name ?? username,
    handle: `@${username}`,
    // The schema default is a stock image; only an uploaded photo counts.
    avatarUrl: profile?.avatar_url?.includes(AVATAR_PATH) ? profile.avatar_url : null,
  };
}

/** Friendly text for the errors Supabase Auth can return. */
function describe(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Wrong email/username or password.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with that email already exists. Try logging in.';
  if (m.includes('email not confirmed')) return 'Confirm your email first, then log in.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a moment and try again.';
  if (m.includes('password')) return 'That password isn’t strong enough.';
  if (m.includes('fetch') || m.includes('network')) return 'Couldn’t reach the server. Check your connection.';
  return 'Something went wrong. Try again.';
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const { data, error } = await supabase.rpc('username_available', { p_username: username });
  // If the lookup itself fails, don't block sign-up; the database trigger copes with collisions.
  return error ? true : Boolean(data);
}

/** Returns an error message, or null on success. `identifier` is an email or @username. */
export async function signIn(identifier: string, password: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  let email = identifier.trim();
  if (!email.includes('@') || email.startsWith('@')) {
    const { data, error } = await supabase.rpc('email_for_username', { p_username: email });
    if (error || !data) return 'Wrong email/username or password.';
    email = data as string;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? describe(error.message) : null;
}

export async function signUp(details: { name: string; username: string; email: string; password: string }): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  if (!(await isUsernameAvailable(details.username))) return 'That username is taken.';

  const { data, error } = await supabase.auth.signUp({
    email: details.email,
    password: details.password,
    options: { data: { name: details.name, username: details.username } },
  });
  if (error) return describe(error.message);
  // With "Confirm email" off, sign-up returns a session. Without one, the project still requires confirmation.
  if (!data.session) return 'Account created. Confirm your email, then log in.';
  return null;
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) await supabase.auth.signOut();
}
