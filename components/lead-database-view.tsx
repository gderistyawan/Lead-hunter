"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import { listLeads } from "@/lib/database";
import type { Lead } from "@/lib/types";

export function LeadDatabaseView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [temperature, setTemperature] = useState("All temperatures");
  const [showFilters, setShowFilters] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listLeads().then((items) => { if (active) setLeads(items); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load leads."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const filtered = useMemo(() => leads.filter((lead) => {
    const text = `${lead.name} ${lead.contact} ${lead.location} ${lead.industry}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (industry === "All industries" || lead.industry === industry) && (temperature === "All temperatures" || lead.temperature === temperature);
  }), [leads, query, industry, temperature]);
  const industries = Array.from(new Set(leads.map((lead) => lead.industry).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const exportLeads = () => {
    if (!filtered.length) return;
    const headers = ["Name", "Contact", "Industry", "Location", "Score", "Temperature", "Source", "Status"];
    const rows = filtered.map((lead) => [lead.name, lead.contact, lead.industry, lead.location, lead.score, lead.temperature, lead.source, lead.status]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lead-hunter-leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR PROSPECTS</div><h1>Lead database</h1><p className="page-subtitle">Organize, filter, and review businesses discovered in your workspace.</p></div><button className="btn" type="button" onClick={exportLeads} disabled={!filtered.length || loading}><Download size={15} /> Export CSV</button></div>
    {error && <div className="notice-box" role="alert"><span>{error}</span><button className="text-link" type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div>}
    <section className="panel database-panel">
      <div className="panel-heading"><div><div className="panel-title">All leads <span style={{ color: "#8998a3", fontWeight: 500 }}>({loading ? "…" : filtered.length})</span></div><div className="panel-description">Search and refine your saved business records.</div></div><button className="btn" type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}><SlidersHorizontal size={14} /> Filters</button></div>
      <div className="filters-row" style={{ padding: "0 18px" }}><div className="search-field-wrap"><Search size={14} /><input className="field" aria-label="Search leads" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search business, contact, industry, or location" /></div>{(query || industry !== "All industries" || temperature !== "All temperatures") && <button className="btn" type="button" onClick={() => { setQuery(""); setIndustry("All industries"); setTemperature("All temperatures"); }}><X size={14} /> Clear</button>}</div>
      {showFilters && <div className="filters-row" style={{ padding: "0 18px 14px" }}><select aria-label="Filter by industry" className="field filter-select" value={industry} onChange={(event) => setIndustry(event.target.value)}><option>All industries</option>{industries.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by temperature" className="field filter-select" value={temperature} onChange={(event) => setTemperature(event.target.value)}><option>All temperatures</option><option value="HOT">Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option></select></div>}
      {loading ? <div className="empty-state" role="status">Loading your leads…</div> : filtered.length ? <><div className="recent-table-wrap"><table className="table"><thead><tr><th>Business / contact</th><th>Industry</th><th>Location</th><th>Score</th><th>Temperature</th><th>Status</th><th>Source</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><div className="business-cell"><span className="business-mark">{lead.initials || lead.name.slice(0, 2).toUpperCase()}</span><span>{lead.name}<small>{lead.contact || "No contact details"}</small></span></div></td><td>{lead.industry}</td><td>{lead.location}</td><td><span className="score">{lead.score}%</span></td><td><span className={`temperature ${lead.temperature.toLowerCase()}`}><span className="dot" />{lead.temperature}</span></td><td><span className="status-text">{lead.status}</span></td><td>{lead.source}</td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} of {leads.length} leads</span><span>Export includes the filtered results</span></div></> : <div className="database-empty">{leads.length ? <><strong>No leads match these filters</strong><p>Try a different search or clear the selected filters.</p></> : <><strong>Your lead database is empty</strong><p>Discover businesses in Search Center and they’ll appear here when saved.</p></>}</div>}
    </section>
  </>;
}
