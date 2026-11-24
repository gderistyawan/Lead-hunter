"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Building2, ChevronRight, Flame, Globe2, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { listLeads, listSearchHistory } from "@/lib/database";
import type { AppPage, Lead } from "@/lib/types";

export function DashboardView({ onNavigate, displayName }: { onNavigate: (page: AppPage) => void; displayName: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    Promise.all([listLeads(), listSearchHistory()])
      .then(([databaseLeads, history]) => {
        setLeads(databaseLeads);
        setSearchCount(history.length);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreeting(hour >= 5 && hour < 11 ? "Good Morning" : hour >= 11 && hour < 18 ? "Good Afternoon" : "Good Evening");
    };
    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const hotLeads = leads.filter((lead) => lead.temperature === "HOT").length;
  const stats = [
    { label: "Total leads", value: loading ? "…" : String(leads.length), note: "in your database", icon: Users, tone: "#e8f6f2", color: "#158e7a" },
    { label: "New leads", value: loading ? "…" : String(leads.filter((lead) => lead.status === "New").length), note: "available to contact", icon: Sparkles, tone: "#eef3ff", color: "#5c78ca" },
    { label: "Hot leads", value: loading ? "…" : String(hotLeads), note: "need your attention", icon: Flame, tone: "#fff1eb", color: "#dc7957" },
    { label: "Search activities", value: loading ? "…" : String(searchCount), note: "searches recorded", icon: Search, tone: "#f4efff", color: "#8d70c8" },
  ];

  const industryCounts = Array.from(new Map(leads.map((lead) => [lead.industry, (leads.filter((item) => item.industry === lead.industry).length)])).entries())
    .sort((a, b) => b[1] - a[1]);

  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR SALES OVERVIEW</div><h1>{greeting && `${greeting}, `}{displayName} <span aria-hidden="true">☀️</span></h1><p className="page-subtitle">Here’s what’s happening with your leads today.</p></div></div>
    <section className="stats-grid" aria-label="Lead metrics">{stats.map(({ label, value, note, icon: Icon, tone, color }) => <article className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon" style={{ background: tone, color }}><Icon size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-bottom"><span>{note}</span></div></article>)}</section>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><div><div className="panel-title">Lead distribution by industry</div><div className="panel-description">Your lead database, by sector</div></div></div>
        {industryCounts.length ? <div className="industry-list">{industryCounts.map(([name, count]) => <div className="industry-row" key={name}><span>{name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(8, count / leads.length * 100)}%` }} /></div><span className="industry-count">{count}</span></div>)}</div> : <div className="empty-state">No lead data yet</div>}
      </section>
      <section className="panel"><div className="panel-heading"><div><div className="panel-title">Connector status</div><div className="panel-description">Data sources for lead discovery</div></div><button className="text-link" onClick={() => onNavigate("Settings")}>Manage <ChevronRight size={13} /></button></div><div className="connector-list">{[{ name: "Business directories", detail: "Connector not configured", icon: Building2 }, { name: "Company websites", detail: "Connector not configured", icon: Globe2 }, { name: "Search engine", detail: "Not configured", icon: Search }].map(({ name, detail, icon: Icon }) => <div className="connector-row" key={name}><span className="connector-logo"><Icon size={15} /></span><span className="connector-copy">{name}<small>{detail}</small></span><span className="connector-state"><span className="dot" /> &nbsp;Offline</span></div>)}</div></section>
    </div>
    <section className="panel"><div className="panel-heading"><div><div className="panel-title">Recent discoveries</div><div className="panel-description">Latest leads in your workspace</div></div><button className="text-link" onClick={() => onNavigate("Lead Database")}>View all leads <ChevronRight size={13} /></button></div>
      {loading ? <div className="empty-state">Loading leads…</div> : leads.length ? <div className="recent-table-wrap"><table className="table"><thead><tr><th>Business / contact</th><th>Industry</th><th>Location</th><th>Score</th><th>Temperature</th></tr></thead><tbody>{leads.slice(0, 4).map((lead) => <tr key={lead.id}><td><div className="business-cell"><span className="business-mark">{lead.initials}</span><span>{lead.name}<small>{lead.contact}</small></span></div></td><td>{lead.industry}</td><td>{lead.location}</td><td className="score">{lead.score}</td><td><span className={`temperature ${lead.temperature.toLowerCase()}`}><span className="dot" />{lead.temperature}</span></td></tr>)}</tbody></table></div> : <div className="empty-state">No leads yet. Run a configured search or add leads to populate this table.</div>}
    </section>
  </>;
}
