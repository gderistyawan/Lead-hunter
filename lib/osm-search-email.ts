import { searchOpenStreetMap as searchBase } from "@/lib/osm-search";
import type { OSMLead as BaseOSMLead } from "@/lib/osm-search";

/**
 * An OSM listing may include email in its raw contact tags.
 * Email remains optional because not every listing provides it.
 */
export interface OSMLead extends BaseOSMLead {
  email?: string;
}

/**
 * Search OpenStreetMap and normalize available email information.
 */
export async function searchOpenStreetMap(input: {
  query: string;
  industry: string;
  location: string;
  maxResults: number;
}): Promise<OSMLead[]> {
  const leads = await searchBase(input);

  return leads.map((lead) => ({
    ...lead,
    email:
      lead.rawTags?.email ||
      lead.rawTags?.["contact:email"] ||
      undefined,
  }));
}

/**
 * Convert OSM search errors into readable messages.
 */
export function osmErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred while searching OpenStreetMap.";
}
