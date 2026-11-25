# LEAD HUNTER AI

Lead Hunter AI is a Next.js application for discovering local businesses through OpenStreetMap and managing authenticated lead records with Supabase.

## Run locally

```bash
npm install
npm run dev
```

Configure the public Supabase URL and publishable key in your local environment. Never place service-role credentials in browser code. Supabase tables must have the owner-scoped Row Level Security policies required by `supabase/rls.sql`.

## Features

- Supabase-authenticated application access and real user-owned leads/search history.
- OpenStreetMap Overpass business search with industry, location, result limit, contact filters, source attribution, and per-lead or multi-select saving.
- Lead database status management, source/industry/status filters, deletion confirmation, and CSV export.
- Search history from Supabase with refresh, loading/error/empty states, and pagination.
- Dashboard counts and industry/activity summaries calculated from real database rows.

The application does not fabricate business/contact records. OpenStreetMap is the only connected discovery provider; other integrations are explicitly shown as unavailable.
