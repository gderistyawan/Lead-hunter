export type Temperature = "HOT" | "WARM" | "COLD";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Follow-up"
  | "Qualified"
  | "Converted"
  | "Lost";

export type DbLeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "qualified"
  | "converted"
  | "rejected";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Follow-up",
  "Qualified",
  "Converted",
  "Lost",
];

export const DB_LEAD_STATUSES: DbLeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "qualified",
  "converted",
  "rejected",
];

const TO_DB_STATUS: Record<LeadStatus, DbLeadStatus> = {
  New: "new",
  Contacted: "contacted",
  Interested: "interested",
  "Follow-up": "follow_up",
  Qualified: "qualified",
  Converted: "converted",
  Lost: "rejected",
};

const FROM_DB_STATUS: Record<DbLeadStatus, LeadStatus> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow-up",
  qualified: "Qualified",
  converted: "Converted",
  rejected: "Lost",
};

export function toDbLeadStatus(status: LeadStatus): DbLeadStatus {
  return TO_DB_STATUS[status];
}

export function fromDbLeadStatus(status: DbLeadStatus): LeadStatus {
  return FROM_DB_STATUS[status];
}

export interface Lead {
  id: string;
  name: string;
  contact: string;
  industry: string;
  location: string;
  score: number;
  temperature: Temperature;
  source: string;
  status: LeadStatus;
  initials: string;

  phone?: string;
  email?: string;
  website?: string;

  business_type?: string;
  product_interest?: string;
  source_url?: string;
  notes?: string;

  city?: string;
  province?: string;
  country?: string;

  osmType?: "node" | "way" | "relation";
  osmId?: number;
  latitude?: number;
  longitude?: number;
  discoveryMethod?: string;
  rawTags?: Record<string, string>;

  metadata?: Record<string, unknown>;
}

export type AppPage =
  | "Dashboard"
  | "Search Center"
  | "Lead Database"
  | "Search History"
  | "Settings";
