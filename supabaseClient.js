// #region agent log
fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:1',message:'Module import start',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:5',message:'Module import success, creating client',data:{url:'https://zapwmvochpxzbshvyvow.supabase.co',hasKey:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Supabase project values (provided by you)
export const SUPABASE_URL = 'https://zapwmvochpxzbshvyvow.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_2BYuBh9ERCMLF0RT0jkPBQ_9_0RI-1E';

// #region agent log
let supabaseClient;
try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:14',message:'Supabase client created successfully',data:{clientExists:!!supabaseClient},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
} catch(e) {
  fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:16',message:'Supabase client creation failed',data:{error:e.message,errorName:e.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  throw e;
}
export const supabase = supabaseClient;
// #endregion

export async function getSessionUser() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:24',message:'getSessionUser called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  try {
    const { data } = await supabase.auth.getSession();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:27',message:'getSession success',data:{hasSession:!!data?.session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return data?.session?.user ?? null;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a0098e94-79c2-4475-b6d2-f7e332a0273c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:31',message:'getSessionUser error',data:{error:err.message,errorName:err.name,stack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
