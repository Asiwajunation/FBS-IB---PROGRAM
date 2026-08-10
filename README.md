# IB PROGRAM — Fresh Project

## Includes
- React + Vite
- Supabase authentication
- Login
- Forgot password
- Password reset
- User dashboard
- Admin settings
- Amount reached
- Target amount
- Progress percentage
- Start date
- Expected completion date
- Withdrawal status

## Local setup

1. Install Node.js.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Put your Supabase URL and publishable key into `.env`.
5. Run `npm run dev`.

## Vercel

Import this folder/repository into Vercel.

Add these Production environment variables:

`VITE_SUPABASE_URL`

`VITE_SUPABASE_PUBLISHABLE_KEY`

Then deploy.

## Supabase table

The application expects a `program_settings` table with:

- id
- target_amount
- reached_amount
- progress_percent
- start_date
- completion_date
- withdrawal_enabled

The default UI values are shown even before Supabase is connected, so the dashboard can be visually tested locally.
