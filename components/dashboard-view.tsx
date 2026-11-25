"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Building2, Clock3, Flame, Globe2, Search, Sparkles, Users } from "lucide-react";
import { listLeads, listSearchHistory } from "@/lib/database";
import type { AppPage, Lead } from "@/lib/types";

type SearchActivity = { id: string; query?: string | null; industry?: string | null; location?: string | null; created_at?: string | null };

export function DashboardView({ onNavigate, displayName }: { onNavigate: (page: AppPage) => void; displayName: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<SearchActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listLeads(), listSearchHistory()])
      .then(([databaseLeads, history]) => {
        if (!active) return;
        setLeads(databaseLeads);
        setActivities(history as SearchActivity[]);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load your dashboard data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreeting(hour >= 5 && hour < 11 ? "Good morning" : hour >= 11 && hour < 18 ? "Good afternoon" : "Good evening");
    };
    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const industryCounts = Array.from(leads.reduce((counts, lead) => counts.set(lead.industry || "Uncategorized", (counts.get(lead.industry || "Uncategorized") ?? 0) + 1), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]);
  const maxIndustryCount = Math.max(1, ...industryCounts.map(([, count]) => count));
  const stats = [
    { label: "Total leads", value: leads.length, note: "in your database", icon: Users, tone: "#e8f6f2", color: "#158e7a" },
    { label: "New leads", value: leads.filter((lead) => lead.status === "New").length, note: "available to contact", icon: Sparkles, tone: "#eef3ff", color: "#5c78ca" },
    { label: "Contacted", value: leads.filter((lead) => lead.status === "Contacted").length, note: "outreach recorded", icon: ArrowUpRight, tone: "#fff6e6", color: "#b17a2b" },
    { label: "Qualified", value: leads.filter((lead) => lead.status === "Qualified").length, note: "marked as qualified", icon: Flame, tone: "#fff1eb", color: "#dc7957" }
  ];
  const formatDate = (value?: string | null) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  return <>
    <div className="page-heading">
      <div>
        <div className="eyebrow">YOUR SALES OVERVIEW</div>
        <h1>{greeting && `${greeting}, `}{displayName} <span aria-hidden="true">☀️</span></h1>
        <p className="page-subtitle">A clear view of your saved leads and recent discovery activity.</p>
      </div>
      <button className="btn btn-primary" type="button" onClick={() => onNavigate("Search Center")}><Search size={15} /> Find businesses</button>
    </div>

    {error && <div className="notice-box" role="alert"><span>{error}</span><button className="text-link" type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div>}

    <section className="stats-grid" aria-label="Lead metrics">
      {stats.map(({ label, value, note, icon: Icon, tone, color }) => <article className="stat-card" key={label}>
        <div className="stat-top"><span>{label}</span><span className="stat-icon" style={{ background: tone, color }}><Icon size={16} /></span></div>
        <div className="stat-value" aria-live="polite">{loading ? "…" : value.toLocaleString()}</div>
        <div className="stat-bottom">{note}</div>
      </article>)}
    </section>

    <div className="dashboard-grid">
      <section className="panel">
        <div className="panel-heading"><div><div className="panel-title">Lead acquisition overview</div><div className="panel-description">Saved leads by industry</div></div><button className="text-link" type="button" onClick={() => onNavigate("Lead Database")}>View database <ArrowUpRight size={13} /></button></div>
        {loading ? <div className="empty-state" role="status">Loading industry breakdown…</div> : industryCounts.length ? <div className="industry-list">{industryCounts.slice(0, 7).map(([name, count]) => <div className="industry-row" key={name}><span>{name}</span><div className="bar-track" role="img" aria-label={`${count} leads in ${name}`}><div className="bar-fill" style={{ width: `${Math.max(4, count / maxIndustryCount * 100)}%` }} /></div><span className="industry-count">{count}</span></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Building2 size={18} /></div><strong>No leads to summarize yet</strong><br />Run a business search to start building your overview.</div>}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><div className="panel-title">Discovery sources</div><div className="panel-description">Live data source status</div></div></div>
        <div className="connector-list">
          <div className="connector-row"><span className="connector-logo"><Globe2 size={15} /></span><span className="connector-copy">OpenStreetMap<small>Business discovery via Overpass</small></span><span className="connector-state"><span className="dot" style={{ background: "#20a17e" }} /> Live</span></div>
          <div className="connector-row"><span className="connector-logo"><Search size={15} /></span><span className="connector-copy">Search activity<small>Recorded in your workspace</small></span><span className="connector-state">{loading ? "…" : activities.length}</span></div>
        </div>
        <div className="panel-heading" style={{ paddingTop: 0 }}><button className="text-link" type="button" onClick={() => onNavigate("Search Center")}>Open Search Center <ArrowUpRight size={13} /></button></div>
      </section>
    </div>

    <section className="panel" style={{ marginBottom: 17 }}>
      <div className="panel-heading"><div><div className="panel-title">Recent activity</div><div className="panel-description">Searches saved from your account</div></div><button className="text-link" type="button" onClick={() => onNavigate("Search History")}>View history <ArrowUpRight size={13} /></button></div>
      {loading ? <div className="empty-state" role="status">Loading recent activity…</div> : activities.length ? <div className="activity-list">{activities.slice(0, 5).map((activity) => <div className="activity-row" key={activity.id}><span className="activity-icon"><Clock3 size={15} /></span><div className="activity-copy"><strong>{activity.query?.trim() || activity.industry?.trim() || "Business discovery search"}</strong><div>{[activity.industry, activity.location].filter(Boolean).join(" · ") || "Search details not provided"}</div><time dateTime={activity.created_at ?? undefined}>{formatDate(activity.created_at)}</time></div></div>)}</div> : <div className="empty-state">No searches have been recorded yet. Start with a location in Search Center.</div>}
    </section>

    <section className="panel">
      <div className="panel-heading"><div><div className="panel-title">Recently added leads</div><div className="panel-description">Latest businesses in your database</div></div><button className="text-link" type="button" onClick={() => onNavigate("Lead Database")}>View all leads <ArrowUpRight size={13} /></button></div>
      {loading ? <div className="empty-state" role="status">Loading leads…</div> : leads.length ? <div className="recent-table-wrap"><table className="table"><thead><tr><th>Business / contact</th><th>Industry</th><th>Location</th><th>Score</th><th>Status</th></tr></thead><tbody>{leads.slice(0, 5).map((lead) => <tr key={lead.id}><td><div className="business-cell"><span className="business-mark">{lead.initials || lead.name.slice(0, 2).toUpperCase()}</span><span>{lead.name}<small>{lead.contact || "No contact details"}</small></span></div></td><td>{lead.industry}</td><td>{lead.location}</td><td><span className="score">{lead.score}%</span></td><td><span className="status-text">{lead.status}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><Users size={18} /></div><strong>Your lead database is ready</strong><br />Search real businesses and save the ones you want to follow up with.</div>}
    </section>
  </>;
}
