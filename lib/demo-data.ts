import type { Lead } from "@/lib/types";

export const demoLeads: Lead[] = [
  { id: "LH-2048", name: "Northstar Health Group", contact: "Maya Chen · Operations Director", industry: "Healthcare", location: "Austin, TX", score: 94, temperature: "HOT", source: "Business directories", status: "New", initials: "NH" },
  { id: "LH-2047", name: "Meridian Cloud Systems", contact: "Evan Brooks · VP of Growth", industry: "Technology", location: "San Jose, CA", score: 88, temperature: "HOT", source: "Company websites", status: "Contacted", initials: "MC" },
  { id: "LH-2046", name: "Greenline Property Co.", contact: "Aisha Patel · Managing Partner", industry: "Real Estate", location: "Denver, CO", score: 81, temperature: "WARM", source: "Business directories", status: "Qualified", initials: "GP" },
  { id: "LH-2045", name: "Harbor & Pine Hospitality", contact: "Leo Martin · General Manager", industry: "Hospitality", location: "Nashville, TN", score: 76, temperature: "WARM", source: "Company websites", status: "New", initials: "HP" },
  { id: "LH-2044", name: "Cobalt Financial Partners", contact: "Jordan Ellis · Founder", industry: "Finance", location: "Charlotte, NC", score: 69, temperature: "COLD", source: "Business directories", status: "New", initials: "CF" },
  { id: "LH-2043", name: "Brightpath Learning", contact: "Sofia Reyes · School Director", industry: "Education", location: "Phoenix, AZ", score: 73, temperature: "WARM", source: "Company websites", status: "Contacted", initials: "BL" }
];

export const industryDistribution = [
  { name: "Technology", count: 284, percent: 84 },
  { name: "Healthcare", count: 216, percent: 66 },
  { name: "Real Estate", count: 172, percent: 53 },
  { name: "Professional services", count: 143, percent: 43 },
  { name: "Hospitality", count: 98, percent: 30 }
];
