import type {
  Lead,
  LeadStatus,
  DbLeadStatus,
} from "@/lib/types";

import {
  DB_LEAD_STATUSES,
  fromDbLeadStatus,
  toDbLeadStatus,
} from "@/lib/types";

import { getSupabase } from "@/lib/supabase";

const LEAD_FIELDS = `
  id,
  user_id,
  business_name,
  contact_name,
  phone,
  email,
  website,
  industry,
  business_type,
  product_interest,
  address,
  city,
  province,
  country,
  source,
  source_url,
  lead_score,
  lead_status,
  notes,
  metadata,
  created_at,
  updated_at
`;

type DatabaseLead = {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  business_type: string | null;
  product_interest: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  source: string | null;
  source_url: string | null;
  lead_score: number | null;
  lead_status: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

export type LeadInput = Omit<Lead, "id"> & {
  id?: string;
};

export type LeadChanges = Partial<Omit<Lead, "id">>;

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser();

  throwIfError(error);

  if (!user) {
    throw new Error("Sign in to continue.");
  }

  return user.id;
}

function normalize(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTemperature(
  score: number,
  metadata: Record<string, unknown>
): Lead["temperature"] {
  const saved = metadata.temperature;

  if (saved === "HOT" || saved === "WARM" || saved === "COLD") {
    return saved;
  }

  if (score >= 75) return "HOT";
  if (score >= 40) return "WARM";

  return "COLD";
}

function getLeadStatus(value: string | null): LeadStatus {
  const normalized = (value ?? "new") as DbLeadStatus;

  if (DB_LEAD_STATUSES.includes(normalized)) {
    return fromDbLeadStatus(normalized);
  }

  return "New";
}

function mapDatabaseLead(row: DatabaseLead): Lead {
  const metadata = row.metadata ?? {};
  const score = row.lead_score ?? 0;
  const name = row.business_name ?? "";

  return {
    id: row.id,
    name,
    contact: row.contact_name ?? "",
    industry: row.industry ?? "",
    location: row.address ?? "",
    score,
    temperature: getTemperature(score, metadata),
    source: row.source ?? "",
    status: getLeadStatus(row.lead_status),
    initials:
      typeof metadata.initials === "string"
        ? metadata.initials
        : getInitials(name),

    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,

    business_type: row.business_type ?? undefined,
    product_interest: row.product_interest ?? undefined,
    source_url: row.source_url ?? undefined,
    notes: row.notes ?? undefined,

    city: row.city ?? undefined,
    province: row.province ?? undefined,
    country: row.country ?? undefined,

    osmType: metadata.osmType as Lead["osmType"],
    osmId: metadata.osmId as number | undefined,
    latitude: metadata.latitude as number | undefined,
    longitude: metadata.longitude as number | undefined,
    discoveryMethod: metadata.discoveryMethod as string | undefined,
    rawTags: metadata.rawTags as Record<string, string> | undefined,

    metadata,
  };
}

function mapLeadToDatabase(
  lead: Partial<Lead>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (lead.name !== undefined) result.business_name = lead.name;
  if (lead.contact !== undefined) result.contact_name = lead.contact;
  if (lead.industry !== undefined) result.industry = lead.industry;
  if (lead.location !== undefined) result.address = lead.location;
  if (lead.score !== undefined) result.lead_score = lead.score;
  if (lead.status !== undefined) {
    result.lead_status = toDbLeadStatus(lead.status);
  }

  if (lead.source !== undefined) result.source = lead.source;
  if (lead.phone !== undefined) result.phone = lead.phone;
  if (lead.email !== undefined) result.email = lead.email;
  if (lead.website !== undefined) result.website = lead.website;

  if (lead.business_type !== undefined) {
    result.business_type = lead.business_type;
  }

  if (lead.product_interest !== undefined) {
    result.product_interest = lead.product_interest;
  }

  if (lead.source_url !== undefined) {
    result.source_url = lead.source_url;
  }

  if (lead.city !== undefined) result.city = lead.city;
  if (lead.province !== undefined) result.province = lead.province;
  if (lead.country !== undefined) result.country = lead.country;
  if (lead.notes !== undefined) result.notes = lead.notes;

  const metadata: Record<string, unknown> = {
    ...(lead.metadata ?? {}),
  };

  if (lead.temperature !== undefined) {
    metadata.temperature = lead.temperature;
  }

  if (lead.initials !== undefined) {
    metadata.initials = lead.initials;
  }

  if (lead.osmType !== undefined) metadata.osmType = lead.osmType;
  if (lead.osmId !== undefined) metadata.osmId = lead.osmId;
  if (lead.latitude !== undefined) metadata.latitude = lead.latitude;
  if (lead.longitude !== undefined) metadata.longitude = lead.longitude;

  if (lead.discoveryMethod !== undefined) {
    metadata.discoveryMethod = lead.discoveryMethod;
  }

  if (lead.rawTags !== undefined) metadata.rawTags = lead.rawTags;

  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }

  return result;
}

// =====================================================
// LEAD CRUD
// =====================================================

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await getSupabase()
    .from("leads")
    .select(LEAD_FIELDS)
    .order("created_at", { ascending: false });

  throwIfError(error);

  return ((data ?? []) as unknown as DatabaseLead[]).map(
    mapDatabaseLead
  );
}

export async function createLead(lead: LeadInput): Promise<Lead> {
  const userId = await currentUserId();

  const businessName = lead.name.trim();
  const businessLocation = lead.location.trim();

  if (!businessName) {
    throw new Error("Business name is required.");
  }

  const { data: matches, error: lookupError } =
    await getSupabase()
      .from("leads")
      .select("id,business_name,address")
      .eq("user_id", userId)
      .ilike("business_name", businessName);

  throwIfError(lookupError);

  const duplicate = (matches ?? []).some((row) => {
    return (
      normalize(row.business_name) === normalize(businessName) &&
      normalize(row.address).split(" (")[0] ===
        normalize(businessLocation).split(" (")[0]
    );
  });

  if (duplicate) {
    throw new Error(
      "This business is already in your lead database."
    );
  }

  const payload = {
    ...mapLeadToDatabase(lead),
    user_id: userId,
  };

  const { data, error } = await getSupabase()
    .from("leads")
    .insert(payload)
    .select(LEAD_FIELDS)
    .single();

  throwIfError(error);

  return mapDatabaseLead(data as unknown as DatabaseLead);
}

export async function updateLead(
  id: string,
  changes: LeadChanges
): Promise<Lead> {
  const userId = await currentUserId();

  const payload = mapLeadToDatabase(changes);

  if (Object.keys(payload).length === 0) {
    throw new Error("No lead changes were provided.");
  }

  const { data, error } = await getSupabase()
    .from("leads")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select(LEAD_FIELDS)
    .single();

  throwIfError(error);

  return mapDatabaseLead(data as unknown as DatabaseLead);
}

export async function deleteLead(id: string): Promise<void> {
  const userId = await currentUserId();

  const { error } = await getSupabase()
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
}

// =====================================================
// SEARCH INPUT
// =====================================================

export interface SearchInput {
  query: string;
  industry: string;
  location: string;
  sources: string[];
  maxResults: number;
  includeContacts: boolean;
  resultCount?: number;
}

// =====================================================
// SAVED SEARCHES
// =====================================================

export async function saveSearch(
  input: SearchInput,
  name?: string
) {
  const userId = await currentUserId();

  const searchName =
    name?.trim() ||
    input.query.trim() ||
    input.industry.trim() ||
    input.location.trim() ||
    "Untitled search";

  const { data, error } = await getSupabase()
    .from("saved_searches")
    .insert({
      user_id: userId,
      name: searchName,
      keyword: input.query,
      industry: input.industry,
      location: input.location,
      filters: input,
    })
    .select()
    .single();

  throwIfError(error);

  return data;
}

export async function listSavedSearches() {
  const { data, error } = await getSupabase()
    .from("saved_searches")
    .select("*")
    .order("created_at", { ascending: false });

  throwIfError(error);

  return data ?? [];
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const userId = await currentUserId();

  const { error } = await getSupabase()
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
}

// =====================================================
// SEARCH HISTORY
// =====================================================

export async function recordSearch(input: SearchInput) {
  const userId = await currentUserId();

  const { data, error } = await getSupabase()
    .from("search_history")
    .insert({
      user_id: userId,
      keyword: input.query,
      industry: input.industry,
      location: input.location,
      target_type: "business",
      results_count: input.resultCount ?? 0,
      search_filters: input,
    })
    .select()
    .single();

  throwIfError(error);

  return data;
}

export async function listSearchHistory(limit = 100) {
  const safeLimit = Math.min(
    Math.max(Math.floor(limit), 1),
    500
  );

  const { data, error } = await getSupabase()
    .from("search_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  throwIfError(error);

  return data ?? [];
}
