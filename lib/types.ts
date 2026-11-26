export type Temperature = "HOT" | "WARM" | "COLD";

// Status displayed in the application UI
export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Follow-up"
  | "Qualified"
  | "Converted"
  | "Lost";

// Status stored in Supabase
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

// Convert application status to Supabase status
export function toDbLeadStatus(status: LeadStatus): DbLeadStatus {
  const mapping: Record<LeadStatus, DbLeadStatus> = {
    New: "new",
    Contacted: "contacted",
    Interested: "interested",
    "Follow-up": "follow_up",
    Qualified: "qualified",
    Converted: "converted",
    Lost: "rejected",
  };

  return mapping[status];
}

// Convert Supabase status to application status
export function fromDbLeadStatus(status: DbLeadStatus): LeadStatus {
  const mapping: Record<DbLeadStatus, LeadStatus> = {
    new: "New",
    contacted: "Contacted",
    interested: "Interested",
    follow_up: "Follow-up",
    qualified: "Qualified",
    converted: "Converted",
    rejected: "Lost",
  };

  return mapping[status];
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
}

export type AppPage =
  | "Dashboard"
  | "Search Center"
  | "Lead Database"
  | "Search History"
  | "Settings";
