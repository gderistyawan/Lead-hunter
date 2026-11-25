"use client";

import { useState } from "react";
import { AlertCircle, Building2, Check, MapPin, Search, Settings2, Sparkles } from "lucide-react";
import { createLead, listLeads, recordSearch } from "@/lib/database";
import type { OSMLead } from "@/lib/osm-search";
import { osmErrorMessage, searchOpenStreetMap } from "@/lib/osm-search";
import { useLanguage } from "@/lib/language-context";

const connectorOptions = ["OpenStreetMap", "Business directories", "Company websites", "Public listings"] as const;
type Connector = (typeof connectorOptions)[number];

const copy = {
  en: {
    title: "Search center",
    eyebrow: "DISCOVER YOUR NEXT CUSTOMER",
    subtitle: "Describe your ideal customer. Find real mapped businesses with OpenStreetMap.",
    engine: "OpenStreetMap search is connected",
    notice: "Searches use public OpenStreetMap data. Other discovery sources are not connected yet.",
    panelTitle: "Tell us who you’re looking for",
    panelIntro: "Describe your ideal business, choose an industry and location, then select discovery sources.",
    queryLabel: "What are you looking for?",
    queryPlaceholder: "e.g. Independent dental clinics in growing suburbs that may need a new patient booking platform",
    queryHint: "Be specific about business type, size, needs, and any other useful signals.",
    industryLabel: "Industry",
    industryPlaceholder: "Select an industry",
    locationLabel: "Location",
    locationPlaceholder: "City, region, or country",
    sourcesLabel: "Select discovery sources",
    sourcesHint: "OpenStreetMap is live. Other sources are placeholders until their connectors are implemented.",
    sourceNames: {
      OpenStreetMap: "OpenStreetMap",
      "Business directories": "Business directories",
      "Company websites": "Company websites",
      "Public listings": "Public listings"
    } satisfies Record<Connector, string>,
    configureButton: "Search businesses",
    searching: "Searching OpenStreetMap…",
    saving: "Saving discovered leads…",
    config: "Search configuration",
    preferences: "RESULT PREFERENCES",
    maxResults: "Maximum results",
    includeContacts: "Include contact details",
    selectedSources: "SELECTED SOURCES",
    connected: "Connected",
    notConnected: "Not connected",
    chooseSource: "Choose at least one source to prepare a search.",
    osmRequired: "Select OpenStreetMap to run a live search. Other sources are not connected yet.",
    quickTip: "QUICK TIP",
    tip: "A focused description and location help OpenStreetMap find better-fit prospects.",
    resultCount: "OPENSTREETMAP RESULTS",
    results: "Businesses found",
    saved: "Saved",
    duplicates: "Already in your lead database",
    resultTitle: "OpenStreetMap results",
    empty: "No matching named businesses were returned for this location. Try a nearby or broader location.",
    details: "View on OpenStreetMap",
    score: "Listing completeness",
    attribution: "© OpenStreetMap contributors",
    historyFailed: "Results were found, but search history could not be saved.",
    saveFailed: "Some leads could not be saved:",
    partial: "Search completed, but some leads could not be saved.",
    unknownError: "Unable to save a discovered business."
  },
  id: {
    title: "Pusat pencarian",
    eyebrow: "TEMUKAN PELANGGAN BERIKUTNYA",
    subtitle: "Deskripsikan pelanggan ideal Anda. Temukan bisnis nyata di OpenStreetMap.",
    engine: "Pencarian OpenStreetMap terhubung",
    notice: "Pencarian menggunakan data publik OpenStreetMap. Sumber lainnya belum terhubung.",
    panelTitle: "Siapa yang Anda cari?",
    panelIntro: "Deskripsikan bisnis ideal, pilih industri dan lokasi, lalu pilih sumber pencarian.",
    queryLabel: "Apa yang Anda cari?",
    queryPlaceholder: "mis. klinik gigi independen di area berkembang yang membutuhkan sistem janji temu",
    queryHint: "Sertakan jenis bisnis, ukuran, kebutuhan, dan informasi berguna lainnya.",
    industryLabel: "Industri",
    industryPlaceholder: "Pilih industri",
    locationLabel: "Lokasi",
    locationPlaceholder: "Kota, wilayah, atau negara",
    sourcesLabel: "Pilih sumber pencarian",
    sourcesHint: "OpenStreetMap aktif. Sumber lain belum memiliki konektor.",
    sourceNames: {
      OpenStreetMap: "OpenStreetMap",
      "Business directories": "Direktori bisnis",
      "Company websites": "Situs web perusahaan",
      "Public listings": "Daftar publik"
    } satisfies Record<Connector, string>,
    configureButton: "Cari bisnis",
    searching: "Mencari di OpenStreetMap…",
    saving: "Menyimpan prospek…",
    config: "Konfigurasi pencarian",
    preferences: "PREFERENSI HASIL",
    maxResults: "Hasil maksimum",
    includeContacts: "Sertakan detail kontak",
    selectedSources: "SUMBER TERPILIH",
    connected: "Terhubung",
    notConnected: "Belum terhubung",
    chooseSource: "Pilih setidaknya satu sumber untuk menyiapkan pencarian.",
    osmRequired: "Pilih OpenStreetMap untuk menjalankan pencarian. Sumber lain belum terhubung.",
    quickTip: "TIPS",
    tip: "Deskripsi dan lokasi yang spesifik membantu OpenStreetMap menemukan prospek yang sesuai.",
    resultCount: "HASIL OPENSTREETMAP",
    results: "Bisnis ditemukan",
    saved: "Tersimpan",
    duplicates: "Sudah ada di database prospek",
    resultTitle: "Hasil OpenStreetMap",
    empty: "Tidak ada bisnis bernama yang cocok di lokasi ini. Coba lokasi terdekat atau lebih luas.",
    details: "Lihat di OpenStreetMap",
    score: "Kelengkapan data",
    attribution: "© kontributor OpenStreetMap",
    historyFailed: "Hasil ditemukan, tetapi riwayat pencarian gagal disimpan.",
    saveFailed: "Sebagian prospek gagal disimpan:",
    partial: "Pencarian selesai, tetapi sebagian prospek gagal disimpan.",
    unknownError: "Prospek gagal disimpan."
  }
} as const;

const industries = [
  "Technology",
  "Healthcare",
  "Real Estate",
  "Finance",
  "Education",
  "Hospitality",
  "Professional services",
  "Retail",
  "Manufacturing",
  "Other"
];

export function SearchCenterView() {
  const { language } = useLanguage();
  const text = copy[language];
  const [selected, setSelected] = useState<Connector[]>(["Business directories", "OpenStreetMap"]);
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState("50");
  const [includeContacts, setIncludeContacts] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<OSMLead[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  const toggleConnector = (name: Connector) => {
    setSelected((current) => current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name]);
  };

  const submitSearch = async () => {
    if (loading || saving) return;
    if (!selected.includes("OpenStreetMap")) {
      setMessage(text.osmRequired);
      return;
    }
    if (!location.trim()) {
      setMessage(osmErrorMessage(new Error("OSM_LOCATION_REQUIRED"), language));
      return;
    }

    setLoading(true);
    setMessage("");
    setResults([]);
    setSaveErrors([]);
    setSavedCount(0);
    setDuplicateCount(0);

    let found: OSMLead[];
    try {
      found = await searchOpenStreetMap({ query, industry, location, maxResults: Number(maxResults) });
    } catch (error) {
      setMessage(osmErrorMessage(error, language));
      setLoading(false);
      return;
    }
    setResults(found);

    if (!found.length) {
      setLoading(false);
      setMessage(text.empty);
      return;
    }

    setSaving(true);
    setLoading(false);
    let historyError = "";
    try {
      await recordSearch({
        query,
        industry,
        location,
        sources: ["OpenStreetMap"],
        maxResults: Number(maxResults),
        includeContacts
      });
    } catch {
      historyError = text.historyFailed;
    }

    const errors: string[] = [];
    let persisted = 0;
    let duplicates = 0;
    try {
      const existing = await listLeads();
      const existingKeys = new Set(existing.map((lead) => dedupeKey(lead.name, lead.location)));
      const newLeads = found.filter((lead) => !existingKeys.has(dedupeKey(lead.name, lead.location)));
      duplicates = found.length - newLeads.length;

      for (const lead of newLeads) {
        try {
          await createLead({
            name: lead.name,
            contact: includeContacts ? lead.contact : "",
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
          errors.push(error instanceof Error ? error.message : text.unknownError);
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : text.unknownError);
    } finally {
      setSaving(false);
    }

    setSavedCount(persisted);
    setDuplicateCount(duplicates);
    setSaveErrors(errors);
    if (errors.length) setMessage(text.partial);
    else if (historyError) setMessage(historyError);
  };

  return <>
    <div className="page-heading">
      <div>
        <div className="eyebrow">{text.eyebrow}</div>
        <h1>{text.title}</h1>
        <p className="page-subtitle">{text.subtitle}</p>
      </div>
      <span className="demo-pill">OpenStreetMap</span>
    </div>
    <div className="demo-banner">
      <AlertCircle size={15} />
      <span><strong>{text.engine}</strong> · {text.notice} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{text.attribution}</a></span>
    </div>
    <div className="search-layout">
      <section className="search-panel">
        <div className="search-intro">
          <h2>{text.panelTitle}</h2>
          <p>{text.panelIntro}</p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="search-description">{text.queryLabel}</label>
          <textarea
            id="search-description"
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.queryPlaceholder}
          />
          <div className="field-hint">{text.queryHint}</div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="industry">{text.industryLabel}</label>
            <div style={{ position: "relative" }}>
              <Building2 size={14} style={{ position: "absolute", left: 11, top: 13, color: "#93a2ac" }} />
              <select id="industry" className="field" style={{ paddingLeft: 33 }} value={industry} onChange={(event) => setIndustry(event.target.value)}>
                <option value="">{text.industryPlaceholder}</option>
                {industries.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="location">{text.locationLabel}</label>
            <div style={{ position: "relative" }}>
              <MapPin size={14} style={{ position: "absolute", left: 11, top: 13, color: "#93a2ac" }} />
              <input
                id="location"
                className="field"
                style={{ paddingLeft: 33 }}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={text.locationPlaceholder}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="form-label">{text.sourcesLabel}</div>
          <div className="connector-select-grid">
            {connectorOptions.map((name) => (
              <button
                type="button"
                aria-pressed={selected.includes(name)}
                className={`connector-option ${selected.includes(name) ? "selected" : ""}`}
                onClick={() => toggleConnector(name)}
                key={name}
              >
                <span style={{
                  width: 17,
                  height: 17,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 5,
                  border: `1px solid ${selected.includes(name) ? "#43ae99" : "#d9e2e7"}`,
                  background: selected.includes(name) ? "#1aa087" : "white",
                  color: "white"
                }}>
                  {selected.includes(name) && <Check size={12} />}
                </span>
                {text.sourceNames[name]}
              </button>
            ))}
          </div>
          <div className="field-hint">{text.sourcesHint}</div>
        </div>
        <div className="search-submit-row">
          <span className="helper-note">{text.attribution}</span>
          <button className="btn btn-primary" onClick={submitSearch} disabled={loading || saving}>
            <Search size={14} />
            {saving ? text.saving : loading ? text.searching : text.configureButton}
          </button>
        </div>
        {message && <div className="notice-box" role="status" style={{ marginTop: 16 }}>
          <AlertCircle size={15} style={{ flex: "0 0 auto", color: "#138f7b" }} />
          {message}
        </div>}
        {!!saveErrors.length && <div className="notice-box" role="alert" style={{ marginTop: 10, display: "block" }}>
          <strong>{text.saveFailed}</strong>
          <ul>{saveErrors.slice(0, 3).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>
        </div>}
      </section>
      <aside className="config-panel">
        <div className="config-heading"><Settings2 size={15} /> {text.config}</div>
        <div className="config-section">
          <div className="config-label">{text.preferences}</div>
          <label className="config-line" htmlFor="max-results">
            <span>{text.maxResults}</span>
            <select id="max-results" className="field" value={maxResults} onChange={(event) => setMaxResults(event.target.value)} style={{ width: 90, minHeight: 30, padding: "0 8px" }}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <div className="config-line">
            <span>{text.includeContacts}</span>
            <button
              type="button"
              className={`switch ${includeContacts ? "on" : ""}`}
              role="switch"
              aria-checked={includeContacts}
              aria-label={text.includeContacts}
              onClick={() => setIncludeContacts((value) => !value)}
            />
          </div>
        </div>
        <div className="config-section">
          <div className="config-label">{text.selectedSources}</div>
          {selected.length ? selected.map((item) => (
            <div className="config-line" key={item}>
              <span>{text.sourceNames[item]}</span>
              <span className="config-value" style={{ color: item === "OpenStreetMap" ? "#138f7b" : "#9ba8b1" }}>
                {item === "OpenStreetMap" ? text.connected : text.notConnected}
              </span>
            </div>
          )) : <div className="field-hint">{text.chooseSource}</div>}
        </div>
        <div className="notice-box">
          <Sparkles size={14} style={{ flex: "0 0 auto", color: "#159b84" }} />
          <span>{text.notice}</span>
        </div>
        <div className="config-section" style={{ marginTop: 14 }}>
          <div className="config-label">{text.quickTip}</div>
          <div style={{ color: "#7d8c98", fontSize: 10, lineHeight: 1.6 }}>{text.tip}</div>
        </div>
        <div className="config-section">
          <div className="config-label">{text.resultCount}</div>
          <div className="config-line"><span>{text.results}</span><strong className="config-value">{results.length}</strong></div>
          <div className="config-line"><span>{text.saved}</span><strong className="config-value">{savedCount}</strong></div>
          <div className="config-line"><span>{text.duplicates}</span><strong className="config-value">{duplicateCount}</strong></div>
        </div>
      </aside>
    </div>
    {!!results.length && <section className="osm-results">
      <div className="panel-heading">
        <div>
          <div className="panel-title">{text.resultTitle} ({results.length})</div>
          <div className="panel-description">{text.attribution}</div>
        </div>
      </div>
      <div className="osm-result-grid">
        {results.map((lead) => (
          <article className="panel osm-result-card" key={`${lead.osmType}/${lead.osmId}`}>
            <h3>{lead.name}</h3>
            <div className="panel-description">{lead.industry}</div>
            <p>{lead.location}</p>
            {includeContacts && lead.phone && <p><strong>Phone:</strong> {lead.phone}</p>}
            {includeContacts && lead.website && <p><strong>Website:</strong> <a href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></p>}
            <a href={lead.sourceUrl} target="_blank" rel="noreferrer">{text.details}</a>
            <div className="osm-score">{text.score}: {lead.score}%</div>
          </article>
        ))}
      </div>
    </section>}
  </>;
}

function dedupeKey(name: string, location: string) {
  return `${name.trim().toLowerCase()}|${location.split(" (")[0].trim().toLowerCase()}`;
}
