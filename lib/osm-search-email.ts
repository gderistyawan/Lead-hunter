import { searchOpenStreetMap as searchBase } from "@/lib/osm-search";
import type { OSMLead as BaseOSMLead } from "@/lib/osm-search";

/** An OSM listing may include email in its raw contact tags, but not every listing does. */
export interface OSMLead extends BaseOSMLead {
  email?: string;
}

/** Normalize optional email tags from the real Overpass response without inventing contact data. */
export async function searchOpenStreetMap(input: { query: string; industry: string; location: string; maxResults: number }): Promise<OSMLead[]> {
  const leads = await searchBase(input);
  return leads.map((lead) => ({
    ...lead,
    email: lead.rawTags.email || lead.rawTags["contact:email"] || undefined
  }));
}
