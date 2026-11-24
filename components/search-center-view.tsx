"use client";

import { useState } from "react";
import { AlertCircle, Building2, Check, ChevronDown, CircleHelp, MapPin, Search, Settings2, Sparkles } from "lucide-react";

const connectorOptions = ["Business directories", "Company websites", "Public listings"];

export function SearchCenterView() {
  const [selected, setSelected] = useState<string[]>(["Business directories"]);
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState("50");
  const [includeContacts, setIncludeContacts] = useState(true);
  const [message, setMessage] = useState("");
  const toggleConnector = (name: string) => setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  const submitSearch = () => {
    if (!query.trim() && !industry.trim() && !location.trim()) {
      setMessage("Add a search description, industry, or location to configure your search.");
      return;
    }
    setMessage("Search is not connected yet. Your configuration is ready, but no search was run and no live results were generated.");
  };
  return <>
    <div className="page-heading"><div><div className="eyebrow">DISCOVER YOUR NEXT CUSTOMER</div><h1>Search center</h1><p className="page-subtitle">Describe your ideal customer. We’ll help you find the right prospects.</p></div><span className="demo-pill">PREVIEW MODE</span></div>
    <div className="demo-banner"><AlertCircle size={15} /><span><strong>Search engine not connected</strong> · Configure your search here. Submitting will not contact external services or return fake results.</span></div>
    <div className="search-layout"><section className="search-panel"><div className="search-intro"><h2>Tell us who you’re looking for</h2><p>Use natural language to describe businesses that fit your ideal customer profile. No search runs in this prototype.</p></div>
      <div className="form-group"><label className="form-label" htmlFor="search-description">What are you looking for?</label><textarea id="search-description" className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Independent dental clinics in growing suburbs that may need a new patient booking platform" /><div className="field-hint">Be specific about business type, size, needs, and any other useful signals.</div></div>
      <div className="form-row"><div className="form-group"><label className="form-label" htmlFor="industry">Industry</label><div style={{ position: "relative" }}><Building2 size={14} style={{ position: "absolute", left: 11, top: 13, color: "#93a2ac" }} /><select id="industry" className="field" style={{ paddingLeft: 33 }} value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="">Select an industry</option>{["Technology", "Healthcare", "Real Estate", "Finance", "Education", "Hospitality", "Professional services", "Retail", "Manufacturing", "Other"].map((item) => <option key={item}>{item}</option>)}</select></div></div><div className="form-group"><label className="form-label" htmlFor="location">Location</label><div style={{ position: "relative" }}><MapPin size={14} style={{ position: "absolute", left: 11, top: 13, color: "#93a2ac" }} /><input id="location" className="field" style={{ paddingLeft: 33 }} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, region, or country" /></div></div></div>
      <div className="form-group"><label className="form-label">Select discovery sources</label><div className="connector-select-grid">{connectorOptions.map((name) => <button type="button" aria-pressed={selected.includes(name)} className={`connector-option ${selected.includes(name) ? "selected" : ""}`} onClick={() => toggleConnector(name)} key={name}><span style={{ width: 17, height: 17, display: "grid", placeItems: "center", borderRadius: 5, border: `1px solid ${selected.includes(name) ? "#43ae99" : "#d9e2e7"}`, background: selected.includes(name) ? "#1aa087" : "white", color: "white" }}>{selected.includes(name) && <Check size={12} />}</span>{name}</button>)}</div><div className="field-hint">Sources are placeholders until connectors are implemented.</div></div>
      <div className="search-submit-row"><span className="helper-note">Your search settings stay in this browser session.</span><button className="btn btn-primary" onClick={submitSearch}><Search size={14} /> Configure search</button></div>
      {message && <div className="notice-box" role="status" style={{ marginTop: 16 }}><AlertCircle size={15} style={{ flex: "0 0 auto", color: "#138f7b" }} />{message}</div>}
    </section>
    <aside className="config-panel"><div className="config-heading"><Settings2 size={15} /> Search configuration</div><div className="config-section"><div className="config-label">RESULT PREFERENCES</div><label className="config-line" htmlFor="max-results"><span>Maximum results</span><select id="max-results" className="field" value={maxResults} onChange={(event) => setMaxResults(event.target.value)} style={{ width: 90, minHeight: 30, padding: "0 8px" }}><option>25</option><option>50</option><option>100</option></select></label><div className="config-line"><span>Include contact details</span><button className={`switch ${includeContacts ? "on" : ""}`} role="switch" aria-checked={includeContacts} aria-label="Include contact details" onClick={() => setIncludeContacts((value) => !value)} /></div></div><div className="config-section"><div className="config-label">SELECTED SOURCES</div>{selected.length ? selected.map((item) => <div className="config-line" key={item}><span>{item}</span><span className="config-value" style={{ color: "#9ba8b1" }}>Not connected</span></div>) : <div className="field-hint">Choose at least one source to prepare a search.</div>}</div><div className="notice-box"><Sparkles size={14} style={{ flex: "0 0 auto", color: "#159b84" }} /><span>Your preferences are UI-only right now. Search execution will be added when the LEAD HUNTER AI Search Engine is ready.</span></div><div className="config-section" style={{ marginTop: 14 }}><div className="config-label">QUICK TIP</div><div style={{ color: "#7d8c98", fontSize: 10, lineHeight: 1.6 }}>A focused description helps the future search engine find better-fit prospects.</div></div><div style={{ display: "none" }}><ChevronDown /><CircleHelp /></div></aside></div>
  </>;
}
