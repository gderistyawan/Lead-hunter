"use client";

import { useState } from "react";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Database, LayoutDashboard, Menu, Search, Settings, ShieldCheck, Sparkles, Target, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardView } from "@/components/dashboard-view";
import { LeadDatabaseView } from "@/components/lead-database-view";
import { SearchCenterView } from "@/components/search-center-view";
import type { AppPage } from "@/lib/types";

const navigation: { name: AppPage; icon: LucideIcon }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Search Center", icon: Search },
  { name: "Lead Database", icon: Database },
  { name: "Search History", icon: Clock3 },
  { name: "Settings", icon: Settings }
];

export function AppShell() {
  const [page, setPage] = useState<AppPage>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = (next: AppPage) => { setPage(next); setMobileOpen(false); };
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };
  const pageInfo: Record<AppPage, { eyebrow: string; title: string; subtitle: string }> = {
    Dashboard: { eyebrow: "YOUR SALES OVERVIEW", title: "Dashboard", subtitle: "Your sales intelligence at a glance." },
    "Search Center": { eyebrow: "DISCOVER YOUR NEXT CUSTOMER", title: "Search center", subtitle: "Configure a search for your ideal customer." },
    "Lead Database": { eyebrow: "YOUR PROSPECTS", title: "Lead database", subtitle: "Browse and manage discovered leads." },
    "Search History": { eyebrow: "YOUR ACTIVITY", title: "Search history", subtitle: "Review your recent discovery activity." },
    Settings: { eyebrow: "WORKSPACE PREFERENCES", title: "Settings", subtitle: "Manage your workspace and integrations." }
  };
  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); navigate("Dashboard"); }}><span className="brand-mark"><Target size={20} /></span><span className="brand-copy">LEAD HUNTER AI<small>SALES INTELLIGENCE</small></span></a>
      <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
      <div className="nav-label">WORKSPACE</div><nav className="nav-list" aria-label="Main navigation">{navigation.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${page === name ? "active" : ""}`} onClick={() => navigate(name)} title={collapsed ? name : undefined} aria-current={page === name ? "page" : undefined}><Icon size={17} strokeWidth={1.8} /><span>{name}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="workspace-card"><span className="workspace-avatar">AS</span><span className="workspace-copy">Acme Sales<small>Free workspace</small></span><ChevronDown size={13} style={{ marginLeft: "auto", color: "#8195a5" }} /></div><div className="sidebar-footnote">LEAD HUNTER AI · PREVIEW</div></div>
    </aside>
    <div className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div className="breadcrumb">Workspace <span style={{ margin: "0 7px", color: "#c2ccd2" }}>/</span> <strong>{page}</strong></div></div><div className="topbar-actions"><button className="icon-button" aria-label="Help" onClick={() => showToast("Help center will be available in a future release.")}><CircleHelp size={16} /></button><button className="icon-button" aria-label="Notifications" onClick={() => showToast("You’re all caught up — this demo has no live notifications.")}><Bell size={16} /><span className="notification-dot" /></button><span className="top-avatar" title="Alex Smith">AS</span></div></header>
      <main className="content">{page === "Dashboard" ? <DashboardView onNavigate={navigate} /> : page === "Search Center" ? <SearchCenterView /> : page === "Lead Database" ? <LeadDatabaseView /> : page === "Search History" ? <HistoryView /> : <SettingsView onToast={showToast} />}</main>
    </div>
    {toast && <div className="toast" role="status"><Sparkles size={15} />{toast}<button aria-label="Dismiss message" onClick={() => setToast("")} style={{ marginLeft: 6, border: 0, background: "transparent", color: "#81918d" }}><X size={14} /></button></div>}
  </div>;
}

function HistoryView() {
  return <><div className="page-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h1>Search history</h1><p className="page-subtitle">Keep track of your recent lead discovery searches.</p></div><span className="demo-pill">DEMO</span></div><div className="demo-banner"><ShieldCheck size={15} /><span><strong>Demo mode</strong> · No searches have been run. Search history will appear here when the search engine is connected.</span></div><section className="panel"><div className="empty-state"><span className="empty-icon"><Clock3 size={18} /></span><strong style={{ display: "block", color: "#52697a", marginBottom: 5 }}>No search history yet</strong>Configure a search in Search Center to get started. Search execution is not available in this preview.</div></section></>;
}

function SettingsView({ onToast }: { onToast: (message: string) => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">WORKSPACE PREFERENCES</div><h1>Settings</h1><p className="page-subtitle">Manage your workspace profile and future integrations.</p></div><span className="demo-pill">PREVIEW</span></div><div className="demo-banner"><ShieldCheck size={15} /><span><strong>Prototype settings</strong> · Changes are not persisted. Backend and account integration are not configured.</span></div><div className="settings-grid"><section className="panel settings-card"><h3>Workspace</h3><p>Basic details for this demo workspace.</p><div className="settings-row"><span>Workspace name</span><strong>Acme Sales</strong></div><div className="settings-row"><span>Plan</span><strong>Free preview</strong></div><div className="settings-row"><span>Data region</span><strong>Not configured</strong></div></section><section className="panel settings-card"><h3>Data connectors</h3><p>Connectors are placeholders for the future search engine integration.</p>{["Business directories", "Company websites", "Search engine"].map((name) => <div className="settings-row" key={name}><span>{name}</span><button className="btn" style={{ minHeight: 29, padding: "0 9px", fontSize: 10 }} onClick={() => onToast("Connectors are not available in this frontend prototype.")}>Not connected</button></div>)}</section><section className="panel settings-card"><h3>Data & privacy</h3><p>Supabase-ready architecture is planned; no user or lead data is sent to a backend in this prototype.</p><div className="settings-row"><span>Backend connection</span><strong>Not configured</strong></div><div className="settings-row"><span>Demo data</span><strong>Enabled</strong></div></section></div></>;
}
