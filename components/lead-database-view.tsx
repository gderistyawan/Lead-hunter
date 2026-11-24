"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Download, Search, SlidersHorizontal, X } from "lucide-react";
import { listLeads } from "@/lib/database";
import type { Lead } from "@/lib/types";

export function LeadDatabaseView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [temperature, setTemperature] = useState("All temperatures");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { listLeads().then(setLeads).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => leads.filter((lead) => {
    const matchesText = `${lead.name} ${lead.contact} ${lead.location}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (industry === "All industries" || lead.industry === industry) && (temperature === "All temperatures" || lead.temperature === temperature);
  }), [leads, query, industry, temperature]);

  const industries = Array.from(new Set(leads.map((lead) => lead.industry)));

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
    <div className="page-heading"><div><div className="eyebrow">YOUR PROSPECTS</div><h1>Lead database</h1><p className="page-subtitle">Organize, filter, and review your discovered leads.</p></div></div>
    <section className="panel database-panel"><div className="panel-heading"><div><div className="panel-title">All leads <span style={{ color: "#99a5ad", fontWeight: 500 }}>({filtered.length})</span></div><div className="panel-description">Showing records in this workspace</div></div><button className="btn" disabled={!filtered.length} onClick={exportLeads}><Download size={14} /> Export</button></div>
      <div className="filters-row" style={{ padding: "0 15px" }}><div className="search-field-wrap"><Search size={14} /><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, contacts, locations..." /></div><button className={`btn ${showFilters ? "btn-primary" : ""}`} onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={14} /> Filters</button>{(query || industry !== "All industries" || temperature !== "All temperatures") && <button className="text-link" onClick={() => { setQuery(""); setIndustry("All industries"); setTemperature("All temperatures"); }}><X size={13} /> Clear</button>}</div>
      {showFilters && <div className="filters-row" style={{ padding: "0 15px 13px" }}><select aria-label="Filter by industry" className="field filter-select" value={industry} onChange={(event) => setIndustry(event.target.value)}><option>All industries</option>{industries.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by temperature" className="field filter-select" value={temperature} onChange={(event) => setTemperature(event.target.value)}><option>All temperatures</option><option>HOT</option><option>WARM</option><option>COLD</option></select></div>}
      {loading ? <div className="empty-state">Loading leads…</div> : filtered.length ? <><div className="recent-table-wrap"><table className="table"><thead><tr><th>Business / contact</th><th>Industry</th><th>Location</th><th>Score <ArrowDownUp size={10} style={{ display: "inline", verticalAlign: "middle" }} /></th><th>Temperature</th><th>Source</th><th>Status</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><div className="business-cell"><span className="business-mark">{lead.initials}</span><span>{lead.name}<small>{lead.contact}</small></span></div></td><td>{lead.industry}</td><td>{lead.location}</td><td className="score">{lead.score}</td><td><span className={`temperature ${lead.temperature.toLowerCase()}`}><span className="dot" />{lead.temperature}</span></td><td>{lead.source}</td><td>{lead.status}</td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} leads</span><span>All records</span></div></> : <div className="empty-state">No leads found. The database is empty or no records match these filters.</div>}
    </section>
  </>;
}
