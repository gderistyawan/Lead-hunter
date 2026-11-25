import type { Lead } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

// Queries intentionally rely on authenticated Supabase sessions and existing RLS policies.
const LEAD_FIELDS = "id,name,contact,industry,location,score,temperature,source,status,initials";
function throwIfError(error: { message: string } | null) { if (error) throw new Error(error.message); }
async function currentUserId() {
  const { data: { user }, error } = await getSupabase().auth.getUser();
  throwIfError(error);
  if (!user) throw new Error("Sign in to continue.");
  return user.id;
}

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await getSupabase().from("leads").select(LEAD_FIELDS).order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as Lead[];
}

function normalize(value: string) { return value.trim().toLocaleLowerCase().replace(/\s+/g, " "); }
export async function createLead(lead: Omit<Lead, "id"> & { id?: string }): Promise<Lead> {
  const userId = await currentUserId();
  // Use existing rows/RLS and the established business-name + location matching rule.
  const { data: matches, error: lookupError } = await getSupabase().from("leads").select("id,name,location").eq("user_id", userId).ilike("name", lead.name.trim());
  throwIfError(lookupError);
  if ((matches ?? []).some((row) => normalize(row.name) === normalize(lead.name) && normalize(row.location.split(" (")[0]) === normalize(lead.location.split(" (")[0]))) {
    throw new Error("This business is already in your lead database.");
  }
  const { data, error } = await getSupabase().from("leads").insert({ ...lead, user_id: userId }).select(LEAD_FIELDS).single();
  throwIfError(error);
  return data as Lead;
}

export async function updateLead(id: string, changes: Partial<Omit<Lead, "id">>): Promise<Lead> {
  const userId = await currentUserId();
  const { data, error } = await getSupabase().from("leads").update(changes).eq("id", id).eq("user_id", userId).select(LEAD_FIELDS).single();
  throwIfError(error);
  return data as Lead;
}
export async function deleteLead(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await getSupabase().from("leads").delete().eq("id", id).eq("user_id", userId);
  throwIfError(error);
}

export interface SearchInput { query: string; industry: string; location: string; sources: string[]; maxResults: number; includeContacts: boolean; resultCount?: number; }
export async function saveSearch(input: SearchInput, name?: string) {
  const userId = await currentUserId();
  const { data, error } = await getSupabase().from("saved_searches").insert({ user_id: userId, name: name ?? (input.query || input.industry || input.location), filters: input }).select().single();
  throwIfError(error); return data;
}
export async function listSavedSearches() {
  const { data, error } = await getSupabase().from("saved_searches").select("*").order("created_at", { ascending: false });
  throwIfError(error); return data ?? [];
}
export async function deleteSavedSearch(id: string) {
  const userId = await currentUserId();
  const { error } = await getSupabase().from("saved_searches").delete().eq("id", id).eq("user_id", userId);
  throwIfError(error);
}
export async function recordSearch(input: SearchInput) {
  const userId = await currentUserId();
  const { data, error } = await getSupabase().from("search_history").insert({ user_id: userId, query: input.query, industry: input.industry, location: input.location, filters: input }).select().single();
  throwIfError(error); return data;
}
export async function listSearchHistory(limit = 100) {
  const { data, error } = await getSupabase().from("search_history").select("*").order("created_at", { ascending: false }).limit(Math.min(Math.max(limit, 1), 500));
  throwIfError(error); return data ?? [];
}
