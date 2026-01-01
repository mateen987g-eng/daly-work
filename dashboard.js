import DailyRecordManager from './script.js';
import { supabase, getSessionUser, onAuthChange, signOut } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ensure user is signed in
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user ?? null;
  if (!user) {
    // redirect to login page
    window.location.href = 'login.html';
    return;
  }

  // show user email and sign out button
  const userEmailEl = document.getElementById('userEmail');
  const signOutBtn = document.getElementById('signOutBtn');
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (signOutBtn) {
    signOutBtn.style.display = 'inline-block';
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      window.location.href = 'login.html';
    });
  }

  // initialize the app manager
  new DailyRecordManager();
});
