# Daily Record Manager — Supabase Setup

This project uses Supabase for authentication and storing user records.

Quick steps to finish setup and deploy:

1) Create the database schema

- Open the Supabase dashboard → SQL Editor and run `migrations/001_create_schema.sql`.

2) Configure your client keys

- In `script.js` set the values (already set if you provided them):

  - `SUPABASE_URL` — your Supabase project URL
  - `SUPABASE_ANON_KEY` — publishable/anon key

  For Vercel, add them as Environment Variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) in Project Settings. For a static site you can keep the anon key client-side.

3) Deploy to Vercel

- Push this repo to GitHub and connect to Vercel, or deploy directly from your file system.

4) Test login / signup

- Open the site, click "Login / Sign up" and use an email + password. Supabase will send a confirmation email if required.
- After signing in the client syncs records with the `records` table.

Notes & troubleshooting

- Ensure RLS policies are applied (they are included in the migration). If you receive permission errors, check the Policies tab in Supabase.
- If your client IDs are not UUIDs, the migration uses `id text`. If you prefer UUIDs, alter the column and client code accordingly.
- For extra security, implement server endpoints for writes and keep keys in server environment variables.

If you want, I can:
- Add serverless API endpoints (Vercel Functions) to proxy writes securely.
- Add client-side UI polishing or automatic redirect after login.
