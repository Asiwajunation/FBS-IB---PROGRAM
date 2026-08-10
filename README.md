# IB PROGRAM

Vercel-ready React + Supabase version of the IB Program portal.

## Setup
1. Copy `.env.example` to `.env.local`.
2. Put your Supabase project URL and publishable key in `.env.local`.
3. Run `npm install` then `npm run build`.
4. In Vercel, add the same two variables under Project Settings → Environment Variables.
5. In Supabase Authentication → URL Configuration, add your Vercel URL as a Redirect URL.

The public welcome page does not show the private progress/withdrawal information. After authentication, the dashboard shows the $200 target, $146 reached, 73% progress, dates, and a withdrawal control locked until 100%.

Do not put a Supabase service-role/secret key in this project or in Vercel client-side environment variables.
