import type { Lead } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

// Expected existing tables: leads, search_history, and saved_searches.
// RLS must be enabled and each table must have a user_id UUID referencing auth.users.
const LEAD_FIELDS = "id,name,contact,industry,location,score,temperature,source,status,initials";

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await getSupabase().from("leads").select(LEAD_FIELDS).order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as Lead[];
}

export async function createLead(lead: Omit<Lead, "id"> & { id?: string }): Promise<Lead> {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Sign in to create a lead.");
  const { data, error } = await getSupabase().from("leads").insert({ ...lead, user_id: user.id }).select(LEAD_FIELDS).single();
  throwIfError(error);
  return data as Lead;
}

export async function updateLead(id: string, changes: Partial<Omit<Lead, "id">>): Promise<Lead> {
  const { data, error } = await getSupabase().from("leads").update(changes).eq("id", id).select(LEAD_FIELDS).single();
  throwIfError(error);
  return data as Lead;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await getSupabase().from("leads").delete().eq("id", id);
  throwIfError(error);
}

export interface SearchInput {
  query: string;
  industry: string;
  location: string;
  sources: string[];
  maxResults: number;
  includeContacts: boolean;
}

export async function saveSearch(input: SearchInput, name?: string) {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Sign in to save a search.");
  const { data, error } = await getSupabase().from("saved_searches").insert({ user_id: user.id, name: name ?? input.query || input.industry || input.location, filters: input }).select().single();
  throwIfError(error);
  return data;
}

export async function listSavedSearches() {
  const { data, error } = await getSupabase().from("saved_searches").select("*").order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function deleteSavedSearch(id: string) {
  const { error } = await getSupabase().from("saved_searches").delete().eq("id", id);
  throwIfError(error);
}

export async function recordSearch(input: SearchInput) {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  throwIfError(authError);
  if (!user) throw new Error("Sign in to record search history.");
  const { data, error } = await getSupabase().from("search_history").insert({ user_id: user.id, query: input.query, industry: input.industry, location: input.location, filters: input }).select().single();
  throwIfError(error);
  return data;
}

export async function listSearchHistory() {
  const { data, error } = await getSupabase().from("search_history").select("*").order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}
