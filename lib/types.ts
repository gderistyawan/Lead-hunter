export type Temperature = "HOT" | "WARM" | "COLD";
export type LeadStatus = "New" | "Contacted" | "Interested" | "Follow-up" | "Qualified" | "Converted" | "Lost";
export const LEAD_STATUSES: LeadStatus[] = ["New", "Contacted", "Interested", "Follow-up", "Qualified", "Converted", "Lost"];

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

export type AppPage = "Dashboard" | "Search Center" | "Lead Database" | "Search History" | "Settings";
