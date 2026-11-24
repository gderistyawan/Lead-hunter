"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Download, Search, SlidersHorizontal, X } from "lucide-react";
import { demoLeads } from "@/lib/demo-data";

export function LeadDatabaseView() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [temperature, setTemperature] = useState("All temperatures");
  const [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(() => demoLeads.filter((lead) => {
    const matchesText = `${lead.name} ${lead.contact} ${lead.location}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (industry === "All industries" || lead.industry === industry) && (temperature === "All temperatures" || lead.temperature === temperature);
  }), [query, industry, temperature]);
  const industries = Array.from(new Set(demoLeads.map((lead) => lead.industry)));
  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR PROSPECTS</div><h1>Lead database</h1><p className="page-subtitle">Organize, filter, and review your discovered leads.</p></div><span className="demo-pill">DEMO DATA</span></div>
    <div className="demo-banner"><span className="dot" style={{ background: "#159b84" }} /><span><strong>Sample records only</strong> · These leads are illustrative demo data, not live prospect information.</span></div>
    <section className="panel database-panel"><div className="panel-heading"><div><div className="panel-title">All leads <span style={{ color: "#99a5ad", fontWeight: 500 }}>({filtered.length})</span></div><div className="panel-description">Showing sample records in this workspace</div></div><button className="btn" onClick={() => alert("Export is disabled for demo data.")}><Download size={14} /> Export</button></div>
      <div className="filters-row" style={{ padding: "0 15px" }}><div className="search-field-wrap"><Search size={14} /><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, contacts, locations..." /></div><button className={`btn ${showFilters ? "btn-primary" : ""}`} onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={14} /> Filters</button>{(query || industry !== "All industries" || temperature !== "All temperatures") && <button className="text-link" onClick={() => { setQuery(""); setIndustry("All industries"); setTemperature("All temperatures"); }}><X size={13} /> Clear</button>}</div>
      {showFilters && <div className="filters-row" style={{ padding: "0 15px 13px" }}><select aria-label="Filter by industry" className="field filter-select" value={industry} onChange={(event) => setIndustry(event.target.value)}><option>All industries</option>{industries.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by temperature" className="field filter-select" value={temperature} onChange={(event) => setTemperature(event.target.value)}><option>All temperatures</option><option>HOT</option><option>WARM</option><option>COLD</option></select></div>}
      {filtered.length ? <><div className="recent-table-wrap"><table className="table"><thead><tr><th>Business / contact</th><th>Industry</th><th>Location</th><th>Score <ArrowDownUp size={10} style={{ display: "inline", verticalAlign: "middle" }} /></th><th>Temperature</th><th>Source</th><th>Status</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><div className="business-cell"><span className="business-mark">{lead.initials}</span><span>{lead.name}<small>{lead.contact}</small></span></div></td><td>{lead.industry}</td><td>{lead.location}</td><td className="score">{lead.score}</td><td><span className={`temperature ${lead.temperature.toLowerCase()}`}><span className="dot" style={{ background: lead.temperature === "HOT" ? "#e47a59" : lead.temperature === "WARM" ? "#dda846" : "#6e9bb8" }} />{lead.temperature}</span></td><td>{lead.source}</td><td>{lead.status}</td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} demo records</span><span>Page 1 of 1</span></div></> : <div className="empty-state">No demo leads match those filters. Try another search.</div>}
    </section>
  </>;
}
