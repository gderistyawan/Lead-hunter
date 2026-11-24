import { ArrowDownRight, ArrowUpRight, Building2, CheckCircle2, ChevronRight, CircleHelp, Clock3, Database, Flame, Globe2, LayoutDashboard, MapPin, Search, Settings2, ShieldCheck, Sparkles, Target, Users, Zap } from "lucide-react";
import { demoLeads, industryDistribution } from "@/lib/demo-data";
import type { AppPage } from "@/lib/types";

const stats = [
  { label: "Total leads", value: "1,284", change: "+12.8%", note: "vs. last month", icon: Users, tone: "#e8f6f2", color: "#158e7a" },
  { label: "New leads", value: "186", change: "+8.2%", note: "this month", icon: Sparkles, tone: "#eef3ff", color: "#5c78ca" },
  { label: "Hot leads", value: "342", change: "+4.6%", note: "need your attention", icon: Flame, tone: "#fff1eb", color: "#dc7957" },
  { label: "Search activities", value: "48", change: "+16.4%", note: "searches this month", icon: Search, tone: "#f4efff", color: "#8d70c8" }
];

function LeadTable({ compact = false }: { compact?: boolean }) {
  const rows = compact ? demoLeads.slice(0, 4) : demoLeads;
  return <div className="recent-table-wrap"><table className="table"><thead><tr><th>Business / contact</th><th>Industry</th><th>Location</th><th>Score</th><th>Temperature</th></tr></thead><tbody>{rows.map((lead) => <tr key={lead.id}><td><div className="business-cell"><span className="business-mark">{lead.initials}</span><span>{lead.name}<small>{lead.contact}</small></span></div></td><td>{lead.industry}</td><td>{lead.location}</td><td className="score">{lead.score}</td><td><span className={`temperature ${lead.temperature.toLowerCase()}`}><span className="dot" style={{ background: lead.temperature === "HOT" ? "#e47a59" : lead.temperature === "WARM" ? "#dda846" : "#6e9bb8" }} />{lead.temperature}</span></td></tr>)}</tbody></table></div>;
}

export function DashboardView({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR SALES OVERVIEW</div><h1>Good morning, Alex <span aria-hidden="true">☀️</span></h1><p className="page-subtitle">Here’s what’s happening with your leads today.</p></div><span className="demo-pill"><span className="dot" style={{ background: "#159b84" }} /> DEMO DATA</span></div>
    <div className="demo-banner"><ShieldCheck size={15} /><span><strong>Demo workspace</strong> · All figures and leads shown here are sample data. Search connectors and live data are not connected.</span></div>
    <section className="stats-grid" aria-label="Lead metrics">{stats.map(({ label, value, change, note, icon: Icon, tone, color }) => <article className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon" style={{ background: tone, color }}><Icon size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-bottom"><span className="stat-change"><ArrowUpRight size={12} />{change}</span><span>{note}</span></div></article>)}</section>
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><div className="panel-title">Lead distribution by industry</div><div className="panel-description">Your sample lead database, by sector</div></div><span className="tag-pill">DEMO</span></div><div className="industry-list">{industryDistribution.map((item) => <div className="industry-row" key={item.name}><span>{item.name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${item.percent}%` }} /></div><span className="industry-count">{item.count}</span></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><div className="panel-title">Connector status</div><div className="panel-description">Data sources for lead discovery</div></div><button className="text-link" onClick={() => onNavigate("Settings")}>Manage <ChevronRight size={13} /></button></div><div className="connector-list">{[{ name: "Business directories", detail: "Connector not configured", icon: Building2 }, { name: "Company websites", detail: "Connector not configured", icon: Globe2 }, { name: "Search engine", detail: "Coming soon", icon: Search }].map(({ name, detail, icon: Icon }) => <div className="connector-row" key={name}><span className="connector-logo"><Icon size={15} /></span><span className="connector-copy">{name}<small>{detail}</small></span><span className="connector-state"><span className="dot" /> &nbsp;Offline</span></div>)}</div></section></div>
    <section className="panel"><div className="panel-heading"><div><div className="panel-title">Recent discoveries</div><div className="panel-description">Latest sample leads in your workspace</div></div><button className="text-link" onClick={() => onNavigate("Lead Database")}>View all leads <ChevronRight size={13} /></button></div><LeadTable compact /></section>
  </>;
}
