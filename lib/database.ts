import type { Lead } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

// =====================================================
// DATABASE FIELD MAPPING
// Supabase schema uses business_name, contact_name,
// lead_score, lead_status, address, etc.
// =====================================================

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

type LeadDetails = Lead & {
  phone?: string;
  email?: string;
  website?: string;
  business_type?: string;
  businessType?: string;
  product_interest?: string;
  productInterest?: string;
  source_url?: string;
  sourceUrl?: string;
  notes?: string;
  city?: string;
  province?: string;
  country?: string;
  metadata?: Record<string, unknown>;
  osmType?: string;
  osmId?: number;
  latitude?: number;
  longitude?: number;
  sourceUrl?: string;
  discoveryMethod?: string;
  rawTags?: Record<string, string>;
};

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

// =====================================================
// HELPERS
// =====================================================

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
  const savedTemperature = metadata.temperature;

  if (
    savedTemperature === "hot" ||
    savedTemperature === "warm" ||
    savedTemperature === "cold"
  ) {
    return savedTemperature as Lead["temperature"];
  }

  if (score >= 75) {
    return "hot" as Lead["temperature"];
  }

  if (score >= 40) {
    return "warm" as Lead["temperature"];
  }

  return "cold" as Lead["temperature"];
}

// =====================================================
// DATABASE -> APPLICATION FORMAT
// =====================================================

function mapDatabaseLead(row: DatabaseLead): Lead {
  const metadata = row.metadata ?? {};
  const score = row.lead_score ?? 0;
  const businessName = row.business_name ?? "";

  return {
    id: row.id,
    name: businessName,
    contact: row.contact_name ?? "",
    industry: row.industry ?? "",
    location: row.address ?? "",
    score,
    temperature: getTemperature(score, metadata),
    source: row.source ?? "",
    status: row.lead_status ?? "LEAD",
    initials: getInitials(businessName),
  } as Lead;
}

// =====================================================
// APPLICATION -> DATABASE FORMAT
// =====================================================

function mapLeadToDatabase(
  lead: Partial<LeadDetails>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if ("name" in lead && lead.name !== undefined) {
    result.business_name = lead.name;
  }

  if ("contact" in lead && lead.contact !== undefined) {
    result.contact_name = lead.contact;
  }

  if ("industry" in lead && lead.industry !== undefined) {
    result.industry = lead.industry;
  }

  if ("location" in lead && lead.location !== undefined) {
    result.address = lead.location;
  }

  if ("score" in lead && lead.score !== undefined) {
    result.lead_score = lead.score;
  }

  if ("status" in lead && lead.status !== undefined) {
    result.lead_status = lead.status;
  }

  if ("source" in lead && lead.source !== undefined) {
    result.source = lead.source;
  }

  if ("phone" in lead && lead.phone !== undefined) {
    result.phone = lead.phone;
  }

  if ("email" in lead && lead.email !== undefined) {
    result.email = lead.email;
  }

  if ("website" in lead && lead.website !== undefined) {
    result.website = lead.website;
  }

  if (
    "business_type" in lead &&
    lead.business_type !== undefined
  ) {
    result.business_type = lead.business_type;
  } else if (
    "businessType" in lead &&
    lead.businessType !== undefined
  ) {
    result.business_type = lead.businessType;
  }

  if (
    "product_interest" in lead &&
    lead.product_interest !== undefined
  ) {
    result.product_interest = lead.product_interest;
  } else if (
    "productInterest" in lead &&
    lead.productInterest !== undefined
  ) {
    result.product_interest = lead.productInterest;
  }

  if ("source_url" in lead && lead.source_url !== undefined) {
    result.source_url = lead.source_url;
  } else if ("sourceUrl" in lead && lead.sourceUrl !== undefined) {
    result.source_url = lead.sourceUrl;
  }

  if ("city" in lead && lead.city !== undefined) {
    result.city = lead.city;
  }

  if ("province" in lead && lead.province !== undefined) {
    result.province = lead.province;
  }

  if ("country" in lead && lead.country !== undefined) {
    result.country = lead.country;
  }

  if ("notes" in lead && lead.notes !== undefined) {
    result.notes = lead.notes;
  }

  // Fields not represented by dedicated database columns
  // are preserved in the metadata JSONB column.
  const metadata: Record<string, unknown> = {
    ...(lead.metadata ?? {}),
  };

  if (lead.temperature !== undefined) {
    metadata.temperature = lead.temperature;
  }

  if (lead.initials !== undefined) {
    metadata.initials = lead.initials;
  }

  const extra = lead as Partial<LeadDetails>;

  if (extra.osmType !== undefined) {
    metadata.osmType = extra.osmType;
  }

  if (extra.osmId !== undefined) {
    metadata.osmId = extra.osmId;
  }

  if (extra.latitude !== undefined) {
    metadata.latitude = extra.latitude;
  }

  if (extra.longitude !== undefined) {
    metadata.longitude = extra.longitude;
  }

  if (extra.discoveryMethod !== undefined) {
    metadata.discoveryMethod = extra.discoveryMethod;
  }

  if (extra.rawTags !== undefined) {
    metadata.rawTags = extra.rawTags;
  }

  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }

  return result;
}

// =====================================================
// LIST LEADS
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

// =====================================================
// CREATE LEAD
// =====================================================

export async function createLead(
  lead: Omit<Lead, "id"> & { id?: string }
): Promise<Lead> {
  const userId = await currentUserId();

  const normalizedLead = lead as LeadDetails;

  const businessName = normalizedLead.name?.trim() ?? "";
  const businessLocation = normalizedLead.location?.trim() ?? "";

  if (!businessName) {
    throw new Error("Business name is required.");
  }

  // Check duplicates using the actual Supabase column names.
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
    ...mapLeadToDatabase(normalizedLead),
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

// =====================================================
// UPDATE LEAD
// =====================================================

export async function updateLead(
  id: string,
  changes: Partial<Omit<Lead, "id">>
): Promise<Lead> {
  const userId = await currentUserId();

  const payload = mapLeadToDatabase(
    changes as Partial<LeadDetails>
  );

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

// =====================================================
// DELETE LEAD
// =====================================================

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

  const { data, error } = await getSupabase()
    .from("saved_searches")
    .insert({
      user_id: userId,
      name:
        name ??
        (input.query || input.industry || input.location),
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

export async function deleteSavedSearch(
  id: string
): Promise<void> {
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
      query: input.query,
      industry: input.industry,
      location: input.location,
      filters: input,
    })
    .select()
    .single();

  throwIfError(error);

  return data;
}

export async function listSearchHistory(limit = 100) {
  const safeLimit = Math.min(
    Math.max(limit, 1),
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
