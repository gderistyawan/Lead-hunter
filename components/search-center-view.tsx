"use client";

import { useState } from "react";
import { AlertCircle, Building2, Check, MapPin, Search, Settings2 } from "lucide-react";
import { createLead, listLeads, recordSearch } from "@/lib/database";
import type { OSMLead } from "@/lib/osm-search";
import { osmErrorMessage, searchOpenStreetMap } from "@/lib/osm-search";
import type { Lead } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

const connectorOptions = ["OpenStreetMap", "Company websites", "Public listings"];
const copy = {
  en: {
    title: "Search center", eyebrow: "DISCOVER YOUR NEXT CUSTOMER", subtitle: "Search genuine business listings from OpenStreetMap.",
    engine: "OpenStreetMap Overpass is live", notice: "Search requests use public OpenStreetMap data. Please keep searches focused; results require named, mapped businesses.",
    panelTitle: "Find local businesses", panelIntro: "Search a location and business type. Results come directly from OpenStreetMap and may not include every business.",
    queryLabel: "Keywords", queryPlaceholder: "e.g. hotel, restaurant, coffee shop", industryLabel: "Industry (optional)", industryPlaceholder: "e.g. hospitality, food", locationLabel: "Location", locationPlaceholder: "e.g. Bali, Indonesia or Denpasar, Bali", sourcesLabel: "Discovery source", osm: "OpenStreetMap", websites: "Company websites", directories: "Public listings", helper: "Only returned OpenStreetMap tags are included; missing contacts stay blank.", button: "Search businesses", searching: "Searching OpenStreetMap…", config: "Search configuration", resultsTitle: "OpenStreetMap results", found: "businesses found", saveState: "Saving discovered leads…", saved: "Saved", duplicates: "already in your lead database", saveFailed: "Some leads were found but could not be saved:", empty: "No matching named businesses were returned for this location. Try a nearby or broader location.", resultCount: "Real OpenStreetMap records", details: "View on OpenStreetMap", score: "Listing completeness", partial: "Search completed, but some leads could not be saved.", attribution: "© OpenStreetMap contributors", source: "Source"
  },
  id: {
    title: "Pusat pencarian", eyebrow: "TEMUKAN PELANGGAN BERIKUTNYA", subtitle: "Cari data bisnis nyata dari OpenStreetMap.",
    engine: "OpenStreetMap Overpass aktif", notice: "Pencarian menggunakan data publik OpenStreetMap. Gunakan pencarian terarah; hasil memerlukan bisnis bernama yang dipetakan.",
    panelTitle: "Temukan bisnis lokal", panelIntro: "Cari lokasi dan jenis bisnis. Hasil berasal langsung dari OpenStreetMap dan mungkin tidak mencakup semua bisnis.",
    queryLabel: "Kata kunci", queryPlaceholder: "mis. hotel, restoran, kedai kopi", industryLabel: "Industri (opsional)", industryPlaceholder: "mis. perhotelan, makanan", locationLabel: "Lokasi", locationPlaceholder: "mis. Bali, Indonesia atau Denpasar, Bali", sourcesLabel: "Sumber pencarian", osm: "OpenStreetMap", websites: "Situs web perusahaan", directories: "Daftar publik", helper: "Hanya tag OpenStreetMap yang tersedia yang ditampilkan; kontak yang tidak ada tetap kosong.", button: "Cari bisnis", searching: "Mencari di OpenStreetMap…", config: "Konfigurasi pencarian", resultsTitle: "Hasil OpenStreetMap", found: "bisnis ditemukan", saveState: "Menyimpan prospek…", saved: "Tersimpan", duplicates: "sudah ada di database prospek", saveFailed: "Sebagian prospek ditemukan tetapi gagal disimpan:", empty: "Tidak ada bisnis bernama yang cocok ditemukan di lokasi ini. Coba area terdekat atau lebih luas.", resultCount: "Data OpenStreetMap asli", details: "Lihat di OpenStreetMap", score: "Kelengkapan data", partial: "Pencarian selesai, tetapi sebagian prospek gagal disimpan.", attribution: "© kontributor OpenStreetMap", source: "Sumber"
  }
} as const;

export function SearchCenterView() {
  const { language } = useLanguage();
  const text = copy[language];
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState("50");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<OSMLead[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  const submitSearch = async () => {
    if (loading || saving) return;
    if (!location.trim()) {
      setMessage(osmErrorMessage(new Error("OSM_LOCATION_REQUIRED"), language));
      setResults([]);
      return;
    }
    setLoading(true);
    setMessage("");
    setResults([]);
    setSaveErrors([]);
    setSavedCount(0);
    setDuplicateCount(0);
    try {
      const found = await searchOpenStreetMap({ query, industry, location, maxResults: Number(maxResults) || 50 });
      setResults(found);
      if (!found.length) {
        setMessage(text.empty);
        return;
      }
      const searchInput = { query, industry, location, sources: ["OpenStreetMap"], maxResults: Number(maxResults) || 50, includeContacts: true };
      try { await recordSearch(searchInput); } catch { /* Results remain available if history storage is unavailable. */ }
      setSaving(true);
      const existing = await listLeads();
      const existingKeys = new Set(existing.map((lead) => dedupeKey(lead.name, lead.location)));
      const newLeads = found.filter((lead) => !existingKeys.has(dedupeKey(lead.name, lead.location)));
      setDuplicateCount(found.length - newLeads.length);
      const errors: string[] = [];
      let persisted = 0;
      for (const lead of newLeads) {
        try {
          await createLead({
            name: lead.name,
            contact: lead.contact,
            industry: lead.industry,
            location: lead.location,
            score: lead.score,
            temperature: lead.temperature,
            source: lead.source,
            status: lead.status,
            initials: lead.initials
          });
          persisted += 1;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Unable to save a discovered business.");
        }
      }
      setSavedCount(persisted);
      setSaveErrors(errors);
      if (errors.length) setMessage(text.partial);
    } catch (error) {
      setMessage(osmErrorMessage(error, language));
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  return <>
    <div className="page-heading"><div><div className="eyebrow">{text.eyebrow}</div><h1>{text.title}</h1><p className="page-subtitle">{text.subtitle}</p></div><span className="demo-pill">OpenStreetMap</span></div>
    <div className="demo-banner"><AlertCircle size={15} /><span><strong>{text.engine}</strong> · {text.notice} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{text.attribution}</a></span></div>
    <div className="search-layout"><section className="search-panel"><div className="search-intro"><h2>{text.panelTitle}</h2><p>{text.panelIntro}</p></div>
      <div className="form-group"><label className="form-label" htmlFor="osm-query">{text.queryLabel}</label><textarea id="osm-query" className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.queryPlaceholder} /></div>
      <div className="form-row"><div className="form-group"><label className="form-label" htmlFor="osm-industry">{text.industryLabel}</label><div style={{ position: "relative" }}><Building2 size={14} style={{ position: "absolute", left: 12, top: 13, color: "#91a1ac" }} /><input id="osm-industry" className="field" style={{ paddingLeft: 35 }} value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder={text.industryPlaceholder} /></div></div>
        <div className="form-group"><label className="form-label" htmlFor="osm-location">{text.locationLabel}</label><div style={{ position: "relative" }}><MapPin size={14} style={{ position: "absolute", left: 12, top: 13, color: "#91a1ac" }} /><input id="osm-location" className="field" style={{ paddingLeft: 35 }} value={location} onChange={(event) => setLocation(event.target.value)} placeholder={text.locationPlaceholder} /></div></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label" htmlFor="osm-max">Maximum results</label><select id="osm-max" className="field" value={maxResults} onChange={(event) => setMaxResults(event.target.value)}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div><div className="form-group"><label className="form-label">{text.sourcesLabel}</label><div className="connector-option selected"><Check size={14} /> {text.osm}</div></div></div>
      <p className="helper-note">{text.helper}</p>
      <div className="search-submit-row"><span className="helper-note">{text.attribution}</span><button className="btn btn-primary" onClick={submitSearch} disabled={loading || saving}><Search size={15} />{loading ? text.searching : saving ? text.saveState : text.button}</button></div>
      {message && <div className="notice-box" role="status" style={{ marginTop: 16 }}><AlertCircle size={15} style={{ flex: "0 0 auto", color: "#138f7b" }} />{message}</div>}
      {!!saveErrors.length && <div className="notice-box" role="alert" style={{ marginTop: 10, display: "block" }}><strong>{text.saveFailed}</strong><ul>{saveErrors.slice(0, 3).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul></div>}
    </section><aside className="config-panel"><div className="config-heading"><Settings2 size={15} /> {text.config}</div><div className="config-section"><div className="config-label">{text.resultCount}</div><div className="config-line"><span>{text.resultsTitle}</span><strong className="config-value">{results.length}</strong></div><div className="config-line"><span>{text.saved}</span><strong className="config-value">{savedCount}</strong></div><div className="config-line"><span>{text.duplicates}</span><strong className="config-value">{duplicateCount}</strong></div><div className="config-line"><span>{text.source}</span><strong className="config-value">OpenStreetMap</strong></div></div></aside></div>
    {!!results.length && <section className="osm-results"><div className="panel-heading"><div><div className="panel-title">{text.resultsTitle} ({results.length})</div><div className="panel-description">{text.attribution}</div></div></div><div className="osm-result-grid">{results.map((lead) => <article className="panel osm-result-card" key={`${lead.osmType}/${lead.osmId}`}><h3>{lead.name}</h3><div className="panel-description">{lead.industry}</div><p>{lead.location}</p>{lead.phone && <p><strong>Phone:</strong> {lead.phone}</p>}{lead.website && <p><strong>Website:</strong> <a href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></p>}<a href={lead.sourceUrl} target="_blank" rel="noreferrer">{text.details}</a><div className="osm-score">{text.score}: {lead.score}%</div></article>)}</div></section>}
  </>;
}

function dedupeKey(name: string, location: string) { return `${name.trim().toLowerCase()}|${location.split(" (")[0].trim().toLowerCase()}`; }
