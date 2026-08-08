# IB PROGRAM

A redesigned Vite + React IB PROGRAM dashboard with Supabase authentication, password reset, progress tracking, admin settings, and the IB PROGRAM logo.

## GitHub / Vercel structure

This project intentionally uses the same root-level structure as the existing repository:

- `index.html`
- `main.jsx`
- `App.jsx`
- `index.css`
- `package.json`
- `vite.config.js`
- `vercel.json`
- `ib-program-logo.png`

## Supabase environment variables

In Vercel, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The Supabase database should contain a `program_settings` table with one row using `id = 1`.

## Deploy

Push/commit the files to the existing `main` branch. Vercel should automatically start a new deployment from the GitHub commit.
