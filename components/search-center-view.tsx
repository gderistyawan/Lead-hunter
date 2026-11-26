"use client";

import { useState } from "react";

import {
  AlertCircle,
  Building2,
  Check,
  MapPin,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import {
  createLead,
  recordSearch,
} from "@/lib/database";

import {
  osmErrorMessage,
  searchOpenStreetMap,
  type OSMLead,
} from "@/lib/osm-search";

import type { Lead } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

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
  "Other",
];

const contactOptions = [
  "All results",
  "Phone available",
  "Website available",
  "Email available",
] as const;

type ContactFilter = (typeof contactOptions)[number];

export function SearchCenterView() {
  const { language } = useLanguage();

  const isIndonesian = language === "id";

  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState("50");

  const [includeContacts, setIncludeContacts] = useState(true);

  const [contactFilter, setContactFilter] =
    useState<ContactFilter>("All results");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [results, setResults] = useState<OSMLead[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function keyOf(item: OSMLead): string {
    return `${item.osmType}/${item.osmId}`;
  }

  function errorText(value: unknown): string {
    return osmErrorMessage(
      value,
      isIndonesian ? "id" : "en"
    );
  }

  function toLead(item: OSMLead): Omit<Lead, "id"> {
    const contactDetails = [
      item.phone && `Phone: ${item.phone}`,
      item.email && `Email: ${item.email}`,
      item.website && `Website: ${item.website}`,
    ].filter(Boolean);

    return {
      name: item.name,
      contact: includeContacts
        ? contactDetails.join(" · ")
        : "",

      industry: item.industry,
      location: item.location,
      score: item.score,
      temperature: item.temperature,
      source: item.source,
      status: "New",
      initials: item.initials,

      phone: includeContacts ? item.phone : undefined,
      email: includeContacts ? item.email : undefined,
      website: includeContacts ? item.website : undefined,

      source_url: item.sourceUrl,

      osmType: item.osmType,
      osmId: item.osmId,
      latitude: item.latitude,
      longitude: item.longitude,
      discoveryMethod: item.discoveryMethod,
      rawTags: item.rawTags,
    };
  }

  async function search() {
    if (loading || saving) return;

    setError("");
    setMessage("");

    const cleanLocation = location.trim();

    if (!cleanLocation) {
      setError(errorText(new Error("OSM_LOCATION_REQUIRED")));
      return;
    }

    const resultLimit = Number(maxResults);

    if (
      !Number.isFinite(resultLimit) ||
      resultLimit < 1 ||
      resultLimit > 100
    ) {
      setError(
        isIndonesian
          ? "Jumlah hasil pencarian harus antara 1 sampai 100."
          : "Maximum results must be between 1 and 100."
      );
      return;
    }

    setLoading(true);
    setResults([]);
    setSelected([]);
    setSaved([]);

    try {
      const found = await searchOpenStreetMap({
        query: query.trim(),
        industry,
        location: cleanLocation,
        maxResults: resultLimit,
      });

      setResults(found);

      try {
        await recordSearch({
          query: query.trim(),
          industry,
          location: cleanLocation,
          sources: ["OpenStreetMap"],
          maxResults: resultLimit,
          includeContacts,
          resultCount: found.length,
        });
      } catch (historyError) {
        console.error(
          "Could not save search history:",
          historyError
        );

        setMessage(
          isIndonesian
            ? "Hasil pencarian ditemukan, tetapi riwayat belum berhasil disimpan."
            : "Results found, but search history could not be saved."
        );
      }

      if (found.length === 0) {
        setMessage(
          isIndonesian
            ? "Tidak ada bisnis yang cocok. Coba lokasi lebih luas atau kata kunci lain."
            : "No matching businesses found. Try a broader location."
        );
      } else if (!message) {
        setMessage(
          isIndonesian
            ? `${found.length} bisnis berhasil ditemukan.`
            : `${found.length} businesses found.`
        );
      }
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }

  const visible = results.filter((lead) => {
    if (contactFilter === "Phone available") {
      return Boolean(lead.phone);
    }

    if (contactFilter === "Website available") {
      return Boolean(lead.website);
    }

    if (contactFilter === "Email available") {
      return Boolean(lead.email);
    }

    return true;
  });

  async function save(items: OSMLead[]) {
    if (saving) return;

    const pending = items.filter(
      (item) => !saved.includes(keyOf(item))
    );

    if (pending.length === 0) return;

    setError("");
    setMessage("");
    setSaving(true);

    let count = 0;
    let duplicateCount = 0;

    const failures: string[] = [];

    try {
      for (const item of pending) {
        try {
          await createLead(toLead(item));

          setSaved((current) =>
            current.includes(keyOf(item))
              ? current
              : [...current, keyOf(item)]
          );

          count++;
        } catch (cause) {
          const errorMessage =
            cause instanceof Error
              ? cause.message
              : "";

          if (
            errorMessage.includes(
              "already in your lead database"
            )
          ) {
            setSaved((current) =>
              current.includes(keyOf(item))
                ? current
                : [...current, keyOf(item)]
            );

            duplicateCount++;
          } else {
            failures.push(
              `${item.name}: ${
                cause instanceof Error
                  ? cause.message
                  : "Unknown error"
              }`
            );
          }
        }
      }

      if (count > 0 || duplicateCount > 0) {
        setMessage(
          isIndonesian
            ? `${count} lead berhasil disimpan. ${duplicateCount} lead sudah ada sebelumnya.`
            : `${count} leads saved. ${duplicateCount} already existed.`
        );
      }

      if (failures.length > 0) {
        setError(failures.slice(0, 3).join(" · "));
      }

      setSelected((current) =>
        current.filter(
          (key) => !pending.some((item) => keyOf(item) === key && saved.includes(key))
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function selectAvailable() {
    setSelected(
      visible
        .filter((item) => !saved.includes(keyOf(item)))
        .map(keyOf)
    );
  }

  function toggleSelected(key: string, checked: boolean) {
    setSelected((current) => {
      if (checked) {
        return current.includes(key)
          ? current
          : [...current, key];
      }

      return current.filter((item) => item !== key);
    });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            DISCOVER YOUR NEXT CUSTOMER
          </div>

          <h1>Search center</h1>

          <p className="page-subtitle">
            Find real, mapped businesses from OpenStreetMap
            in Bali, Indonesia, and beyond.
          </p>
        </div>

        <span className="demo-pill">
          OpenStreetMap · Live
        </span>
      </div>

      <div className="demo-banner">
        <AlertCircle size={15} />

        <span>
          <strong>OpenStreetMap Overpass</strong> is a live
          public data source. Contact fields appear only
          when mapped. Other discovery services are not
          connected.{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </span>
      </div>

      <div className="search-layout">
        <section className="search-panel">
          <div className="search-intro">
            <h2>Find local businesses</h2>

            <p>
              Search by keyword, industry, and location.
              Try “Bali, Indonesia” or “Denpasar, Bali”.
            </p>
          </div>

          <div className="form-group">
            <label
              className="form-label"
              htmlFor="search-description"
            >
              Keywords
            </label>

            <textarea
              id="search-description"
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. hotel, restaurant, coffee shop"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="industry">
                Industry
              </label>

              <div className="icon-field">
                <Building2 size={15} />

                <select
                  id="industry"
                  className="field"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                >
                  <option value="">Any industry</option>

                  {industries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location">
                Location
              </label>

              <div className="icon-field">
                <MapPin size={15} />

                <input
                  id="location"
                  className="field"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Bali, Indonesia or Denpasar, Bali"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void search();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="search-submit-row">
            <span className="helper-note">
              Results contain only information present in OpenStreetMap.
            </span>

            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void search()}
              disabled={loading || saving}
            >
              <Search size={15} />

              {loading ? "Searching OpenStreetMap…" : "Search businesses"}
            </button>
          </div>

          {error && (
            <div className="notice-box" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="notice-box" role="status">
              <Check size={15} />
              <span>{message}</span>
            </div>
          )}
        </section>

        <aside className="config-panel">
          <div className="config-heading">
            <Settings2 size={15} />
            Search configuration
          </div>

          <div className="config-section">
            <div className="config-label">
              RESULT PREFERENCES
            </div>

            <label className="config-line" htmlFor="max-results">
              <span>Maximum results</span>

              <select
                id="max-results"
                className="field compact-field"
                value={maxResults}
                onChange={(event) => setMaxResults(event.target.value)}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>

            <div className="config-line">
              <span>Include contact fields</span>

              <button
                type="button"
                role="switch"
                aria-checked={includeContacts}
                aria-label="Include contact fields"
                className={`switch ${includeContacts ? "on" : ""}`}
                onClick={() => setIncludeContacts((value) => !value)}
              />
            </div>

            <label className="config-line" htmlFor="contact-filter">
              <span>Contact availability</span>

              <select
                id="contact-filter"
                className="field compact-field"
                value={contactFilter}
                onChange={(event) =>
                  setContactFilter(event.target.value as ContactFilter)
                }
              >
                {contactOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="config-section">
            <div className="config-label">SOURCE</div>

            <div className="config-line">
              <span>OpenStreetMap</span>
              <strong className="config-value">Connected</strong>
            </div>

            <div className="config-line">
              <span>Company websites</span>
              <span className="config-value">Not connected</span>
            </div>
          </div>

          <div className="notice-box">
            <Sparkles size={14} />
            <span>
              Missing contact information is never generated.
            </span>
          </div>
        </aside>
      </div>

      {results.length > 0 && (
        <section className="osm-results">
          <div className="panel-heading">
            <div>
              <div className="panel-title">
                OpenStreetMap results ({visible.length})
              </div>

              <div className="panel-description">
                Select records to save them in your lead database.
              </div>
            </div>

            <div className="lead-toolbar">
              <button
                className="btn"
                type="button"
                onClick={selectAvailable}
                disabled={saving}
              >
                Select available
              </button>

              <button
                className="btn btn-primary"
                type="button"
                disabled={selected.length === 0 || saving}
                onClick={() =>
                  void save(
                    visible.filter((item) =>
                      selected.includes(keyOf(item))
                    )
                  )
                }
              >
                {saving ? "Saving…" : `Save selected (${selected.length})`}
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="notice-box">
              <AlertCircle size={15} />
              <span>
                {isIndonesian
                  ? "Tidak ada hasil yang sesuai dengan filter kontak."
                  : "No results match the selected contact filter."}
              </span>
            </div>
          ) : (
            <div className="osm-result-grid">
              {visible.map((lead) => {
                const key = keyOf(lead);
                const isSaved = saved.includes(key);

                const availableContacts = [
                  lead.phone && "Phone",
                  lead.email && "Email",
                  lead.website && "Website",
                ].filter(Boolean);

                return (
                  <article
                    className="panel osm-result-card"
                    key={key}
                  >
                    <div className="result-title-row">
                      <label className="result-select">
                        <input
                          type="checkbox"
                          aria-label={`Select ${lead.name}`}
                          checked={selected.includes(key)}
                          disabled={isSaved || saving}
                          onChange={(event) =>
                            toggleSelected(key, event.target.checked)
                          }
                        />
                      </label>

                      <div>
                        <h3>{lead.name}</h3>

                        <div className="panel-description">
                          {lead.industry}
                        </div>
                      </div>
                    </div>

                    <p>{lead.location}</p>

                    {lead.phone && includeContacts && (
                      <p>
                        <strong>Phone:</strong> {lead.phone}
                      </p>
                    )}

                    {lead.email && includeContacts && (
                      <p>
                        <strong>Email:</strong>{" "}
                        <a href={`mailto:${lead.email}`}>
                          {lead.email}
                        </a>
                      </p>
                    )}

                    {lead.website && includeContacts && (
                      <p>
                        <strong>Website:</strong>{" "}
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {lead.website}
                        </a>
                      </p>
                    )}

                    <p className="contact-availability">
                      Contact:{" "}
                      {availableContacts.length > 0
                        ? availableContacts.join(", ")
                        : "No contact details mapped"}
                    </p>

                    <div className="result-actions">
                      <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on OpenStreetMap
                      </a>

                      <button
                        type="button"
                        className="btn"
                        disabled={isSaved || saving}
                        onClick={() => void save([lead])}
                      >
                        {isSaved ? (
                          <>
                            <Check size={14} />
                            Saved
                          </>
                        ) : (
                          "Save lead"
                        )}
                      </button>
                    </div>

                    <div className="osm-score">
                      Listing completeness: {lead.score}%
                      {" · "}© OpenStreetMap contributors
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
