import type { Lead } from "@/lib/types";

export interface OSMLead extends Lead {
  osmType: "node" | "way" | "relation";
  osmId: number;
  latitude: number;
  longitude: number;
  website?: string;
  phone?: string;
  email?: string;
  sourceUrl: string;
  discoveryMethod: "OpenStreetMap Overpass";
  rawTags: Record<string, string>;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
  remark?: string;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;

const cache = new Map<
  string,
  {
    expiresAt: number;
    value: OSMLead[];
  }
>();

const tagPatterns: Array<{
  pattern: RegExp;
  selectors: string[];
  category: string;
}> = [
  {
    pattern: /hotel|hostel|motel|resort|guest.?house|accommodation|penginapan/i,
    selectors: [
      '["tourism"~"hotel|motel|hostel|guest_house|resort|chalet|apartment|camp_site",i]',
    ],
    category: "tourism",
  },
  {
    pattern: /restaurant|food|dining|warung|eatery/i,
    selectors: [
      '["amenity"~"restaurant|cafe|fast_food|food_court",i]',
      '["shop"="bakery"]',
    ],
    category: "amenity",
  },
  {
    pattern: /cafe|coffee|kopi/i,
    selectors: [
      '["amenity"~"cafe|ice_cream",i]',
      '["shop"~"coffee|tea",i]',
    ],
    category: "amenity",
  },
  {
    pattern: /bar|pub|night.?club/i,
    selectors: ['["amenity"~"bar|pub|nightclub",i]'],
    category: "amenity",
  },
  {
    pattern: /shop|retail|store|market|toko/i,
    selectors: ['["shop"]'],
    category: "shop",
  },
  {
    pattern: /office|agency|consult/i,
    selectors: ['["office"]'],
    category: "office",
  },
  {
    pattern: /craft|artisan/i,
    selectors: ['["craft"]'],
    category: "craft",
  },
  {
    pattern: /factory|industrial|manufactur/i,
    selectors: [
      '["landuse"="industrial"]',
      '["building"~"industrial|warehouse|manufacture",i]',
    ],
    category: "industrial",
  },
  {
    pattern: /tourism|attraction|museum|spa|beach|park/i,
    selectors: [
      '["tourism"]',
      '["leisure"~"park|garden|sports_centre|water_park",i]',
    ],
    category: "tourism",
  },
];

const generalSelectors = [
  '["shop"]',
  '["amenity"~"restaurant|cafe|fast_food|bar|pub|marketplace|bank|clinic|hospital|pharmacy|school|fuel",i]',
  '["tourism"~"hotel|motel|hostel|guest_house|resort|attraction|museum|camp_site|apartment",i]',
  '["office"]',
  '["craft"]',
  '["landuse"="industrial"]',
  '["building"~"commercial|retail|industrial|warehouse|hotel",i]',
];

/**
 * Escape text before inserting it into an Overpass regular expression.
 */
function escapeOverpass(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termsFor(input: {
  query: string;
  industry: string;
}): string[] {
  return `${input.industry} ${input.query}`
    .trim()
    .split(/[\s,;]+/)
    .map((term) => term.trim())
    .filter(
      (term) =>
        term.length > 2 &&
        !/^(the|and|for|near|with|business|businesses|in|of)$/i.test(term)
    );
}

function areaSearchName(location: string): string {
  const tokens = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const countryNames =
    /^(indonesia|id|usa|united states|uk|united kingdom)$/i;

  return (
    [...tokens].reverse().find((part) => !countryNames.test(part)) ??
    location.trim()
  );
}

function buildQuery(
  location: string,
  input: {
    query: string;
    industry: string;
  },
  maxResults: number
): string {
  const areaName = escapeOverpass(areaSearchName(location));
  const terms = termsFor(input);

  const matched = tagPatterns.filter(({ pattern }) =>
    pattern.test(terms.join(" "))
  );

  const selectors = matched.length
    ? matched.flatMap(({ selectors: choices }) => choices)
    : generalSelectors;

  // Escape each term separately so the | remains an OR operator.
  const namePattern = terms.map(escapeOverpass).join("|");

  const nameSelector = namePattern
    ? `nwr(area.searchArea)["name"~"${namePattern}",i];`
    : "";

  const businessSelectors = selectors
    .map((selector) => `nwr(area.searchArea)["name"]${selector};`)
    .join("\n  ");

  const resultLimit = Math.min(
    Math.max(Math.floor(maxResults * 5), maxResults),
    500
  );

  return `
[out:json][timeout:25];
area["name"~"^${areaName}$",i]["boundary"="administrative"]->.searchArea;
(
  ${businessSelectors}
  ${nameSelector}
);
out center tags ${resultLimit};
`.trim();
}

function addressFromTags(
  tags: Record<string, string>,
  fallback: string
): string {
  const full = tags["addr:full"];

  if (full) {
    return full;
  }

  const street = [
    tags["addr:housenumber"],
    tags["addr:street"],
  ]
    .filter(Boolean)
    .join(" ");

  const locality = [
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ]
    .filter(Boolean)
    .join(", ");

  return [street, locality].filter(Boolean).join(", ") || fallback;
}

function categoryFromTags(
  tags: Record<string, string>,
  requestedIndustry: string,
  requestedTerms: string[]
): string {
  for (const key of [
    "shop",
    "amenity",
    "tourism",
    "office",
    "craft",
    "industrial",
    "building",
    "leisure",
  ]) {
    if (tags[key]) {
      return tags[key].replace(/_/g, " ");
    }
  }

  return requestedIndustry.trim() || requestedTerms[0] || "Business";
}

function hasRequestedCategory(
  tags: Record<string, string>,
  input: {
    query: string;
    industry: string;
  }
): boolean {
  const terms = termsFor(input);

  if (terms.length === 0) {
    return true;
  }

  const pattern = tagPatterns.find(({ pattern }) =>
    pattern.test(terms.join(" "))
  );

  if (pattern) {
    return (
      Object.entries(tags).some(([key, value]) =>
        pattern.pattern.test(`${key} ${value}`)
      ) ||
      terms.some((term) =>
        (tags.name ?? "").toLowerCase().includes(term.toLowerCase())
      )
    );
  }

  const searchable = [
    tags.name ?? "",
    ...Object.entries(tags).map(([key, value]) => `${key} ${value}`),
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) =>
    searchable.includes(term.toLowerCase())
  );
}

function normalize(
  element: OverpassElement,
  location: string,
  input: {
    query: string;
    industry: string;
  }
): OSMLead | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();

  if (!name) {
    return null;
  }

  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  const website =
    tags.website ||
    tags["contact:website"] ||
    tags.url ||
    undefined;

  const phone =
    tags.phone ||
    tags["contact:phone"] ||
    tags["phone:mobile"] ||
    undefined;

  const email =
    tags.email ||
    tags["contact:email"] ||
    undefined;

  const contacts = [
    phone && `Phone: ${phone}`,
    email && `Email: ${email}`,
    website && `Website: ${website}`,
  ].filter(Boolean);

  const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;

  const address = addressFromTags(tags, location);

  const completeness = [
    tags.name,
    address && address !== location,
    website,
    phone,
    email,
  ].filter(Boolean).length;

  const score = Math.round((completeness / 5) * 100);

  const businessType = categoryFromTags(
    tags,
    input.industry,
    termsFor(input)
  );

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    contact: contacts.join(" · "),
    industry: businessType,
    location: `${address} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
    score,
    temperature: "COLD",
    source: `OpenStreetMap · ${sourceUrl}`,
    status: "New",
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),

    osmType: element.type,
    osmId: element.id,
    latitude,
    longitude,

    website,
    phone,
    email,

    sourceUrl,
    discoveryMethod: "OpenStreetMap Overpass",
    rawTags: tags,
  };
}

async function requestOverpass(
  query: string,
  signal: AbortSignal
): Promise<OverpassResponse> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          data: query,
        }).toString(),
        signal,
        cache: "no-store",
      });

      if (response.status === 429) {
        lastError = new Error("OSM_RATE_LIMIT");
        continue;
      }

      if ([502, 503, 504].includes(response.status)) {
        lastError = new Error("OSM_TIMEOUT");
        continue;
      }

      if (!response.ok) {
        throw new Error(`OSM_HTTP_${response.status}`);
      }

      const payload = (await response.json()) as OverpassResponse;

      if (!Array.isArray(payload.elements)) {
        throw new Error("OSM_INVALID_RESPONSE");
      }

      return payload;
    } catch (error) {
      if (signal.aborted) {
        throw new Error("OSM_TIMEOUT");
      }

      lastError =
        error instanceof Error
          ? error
          : new Error("OSM_NETWORK_ERROR");

      if (
        /OSM_HTTP_/.test(lastError.message) &&
        !/OSM_HTTP_(502|503|504)/.test(lastError.message)
      ) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("OSM_UNAVAILABLE");
}

export async function searchOpenStreetMap(input: {
  query: string;
  industry: string;
  location: string;
  maxResults: number;
}): Promise<OSMLead[]> {
  const location = input.location.trim();

  if (!location) {
    throw new Error("OSM_LOCATION_REQUIRED");
  }

  const normalizedInput = {
    query: input.query.trim(),
    industry: input.industry.trim(),
  };

  const requestedLimit = Number.isFinite(input.maxResults)
    ? Math.floor(input.maxResults)
    : 20;

  const maxResults = Math.min(
    100,
    Math.max(1, requestedLimit)
  );

  const cacheKey = JSON.stringify([
    location.toLowerCase(),
    normalizedInput,
    maxResults,
  ]);

  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const query = buildQuery(
    location,
    normalizedInput,
    maxResults
  );

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await requestOverpass(
      query,
      controller.signal
    );

    if (response.remark) {
      throw new Error("OSM_QUERY_REJECTED");
    }

    const unique = new Map<string, OSMLead>();

    for (const element of response.elements ?? []) {
      const tags = element.tags ?? {};

      if (!hasRequestedCategory(tags, normalizedInput)) {
        continue;
      }

      const lead = normalize(
        element,
        location,
        normalizedInput
      );

      if (!lead) {
        continue;
      }

      const uniqueKey = `${element.type}/${element.id}`;

      if (!unique.has(uniqueKey)) {
        unique.set(uniqueKey, lead);
      }
    }

    const results = [...unique.values()].slice(0, maxResults);

    cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: results,
    });

    return results;
  } finally {
    clearTimeout(timeout);
  }
}

export function osmErrorMessage(
  error: unknown,
  language: "en" | "id"
): string {
  const code =
    error instanceof Error ? error.message : "";

  const messages = {
    en: {
      OSM_LOCATION_REQUIRED:
        "Enter a location for the OpenStreetMap search.",
      OSM_RATE_LIMIT:
        "OpenStreetMap is rate-limiting requests. Please wait a moment and try again.",
      OSM_TIMEOUT:
        "OpenStreetMap search timed out. Try a smaller area or retry shortly.",
      OSM_QUERY_REJECTED:
        "OpenStreetMap could not process this search. Try a more specific location.",
      OSM_INVALID_RESPONSE:
        "OpenStreetMap returned an unexpected response.",
      OSM_UNAVAILABLE:
        "OpenStreetMap search is temporarily unavailable. Please try again later.",
      OSM_NETWORK_ERROR:
        "Could not reach OpenStreetMap. Check your connection and try again.",
    },
    id: {
      OSM_LOCATION_REQUIRED:
        "Masukkan lokasi untuk pencarian OpenStreetMap.",
      OSM_RATE_LIMIT:
        "OpenStreetMap membatasi permintaan. Tunggu sebentar lalu coba lagi.",
      OSM_TIMEOUT:
        "Pencarian OpenStreetMap kehabisan waktu. Coba area lebih kecil atau ulangi sebentar lagi.",
      OSM_QUERY_REJECTED:
        "OpenStreetMap tidak dapat memproses pencarian ini. Coba lokasi yang lebih spesifik.",
      OSM_INVALID_RESPONSE:
        "OpenStreetMap memberikan respons yang tidak dikenali.",
      OSM_UNAVAILABLE:
        "Pencarian OpenStreetMap sementara tidak tersedia. Coba lagi nanti.",
      OSM_NETWORK_ERROR:
        "Tidak dapat terhubung ke OpenStreetMap. Periksa koneksi Anda lalu coba lagi.",
    },
  } as const;

  const languageMessages = messages[language];

  return (
    languageMessages[
      code as keyof typeof languageMessages
    ] ??
    (language === "id"
      ? "Pencarian gagal. Silakan coba lagi."
      : "Search failed. Please try again.")
  );
}
