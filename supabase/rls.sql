-- Apply in Supabase SQL Editor only after reviewing the existing schema.
-- This script deliberately creates no tables. It adds user_id where needed and
-- enables owner-only RLS for existing application tables, without exposing service keys.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['leads', 'search_history', 'saved_searches'] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade', table_name);
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists "Users manage their own rows" on public.%I', table_name);
      execute format('create policy "Users manage their own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
    end if;
  end loop;
end $$;
