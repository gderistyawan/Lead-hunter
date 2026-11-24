# LEAD HUNTER AI

Initial frontend prototype for a universal, multi-industry sales intelligence and lead discovery platform.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Prototype scope

- Next.js App Router, TypeScript, Tailwind CSS, and Lucide React.
- Responsive dashboard, collapsible navigation, Search Center configuration, filterable lead database, search history, and settings views.
- All dashboard and lead records are clearly identified as **DEMO** sample data.
- Search submission intentionally does not make API calls or generate results. Connector states are placeholders.
- No backend or external API integration is included. `lib/` holds frontend data and types separately from UI components, ready for a future Supabase/search-engine adapter.

The UI uses small in-project primitives and CSS styling inspired by shadcn/ui patterns; shadcn components can be added as the design system is expanded.
