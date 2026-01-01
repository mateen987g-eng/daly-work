import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase project values (provided by you)
export const SUPABASE_URL = 'https://zapwmvochpxzbshvyvow.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_2BYuBh9ERCMLF0RT0jkPBQ_9_0RI-1E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getSessionUser() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
  } catch (err) {
    console.error('getSessionUser error', err);
    return null;
  }
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((event, session) => cb(event, session));
}

export async function signOut() {
  return supabase.auth.signOut();
}
