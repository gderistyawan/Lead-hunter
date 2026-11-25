"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Bell, ChevronRight, Clock3, Database, LayoutDashboard, Menu, Search, Settings, ShieldCheck, Sparkles, Target, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardView } from "@/components/dashboard-view";
import { LeadDatabaseView } from "@/components/lead-database-view";
import { SearchCenterView } from "@/components/search-center-view";
import { listSearchHistory } from "@/lib/database";
import { useLanguage, type Language } from "@/lib/language-context";
import type { AppPage } from "@/lib/types";

type SearchActivity = { id: string; query?: string | null; industry?: string | null; location?: string | null; created_at: string };
const navigation: { name: AppPage; icon: LucideIcon }[] = [
  { name: "Dashboard", icon: LayoutDashboard }, { name: "Search Center", icon: Search },
  { name: "Lead Database", icon: Database }, { name: "Search History", icon: Clock3 }, { name: "Settings", icon: Settings }
];

function getDisplayName(session: Session): string {
  const metadata = session.user.user_metadata;
  const name = [metadata.full_name, metadata.name, metadata.display_name].find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return name?.trim() || "Welcome to Lead Hunter AI";
}
function getInitials(name: string) { return name === "Welcome to Lead Hunter AI" ? "U" : name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "U"; }

export function AppShell({ session }: { session: Session }) {
  const [page, setPage] = useState<AppPage>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [activities, setActivities] = useState<SearchActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [readStatus, setReadStatus] = useState<{ userId: string; ids: string[] } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const displayName = getDisplayName(session);
  const initials = getInitials(displayName);
  const readStatusKey = `lead-hunter:read-search-activities:${session.user.id}`;
  const navigate = (next: AppPage) => { setPage(next); setMobileOpen(false); };
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };
  const readActivityIds = readStatus?.userId === session.user.id ? readStatus.ids : [];
  const unreadCount = activities.filter((activity) => !readActivityIds.includes(activity.id)).length;

  useEffect(() => {
    let active = true;
    setActivities([]); setActivityLoading(true); setNotificationError("");
    try {
      const saved = window.localStorage.getItem(readStatusKey);
      const ids: unknown = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) throw new Error("Saved notification status is invalid.");
      setReadStatus({ userId: session.user.id, ids });
    } catch (error) {
      setReadStatus({ userId: session.user.id, ids: [] });
      setNotificationError(error instanceof Error ? error.message : "Unable to load saved notification status.");
    }
    void listSearchHistory().then((history) => { if (active) setActivities(history); })
      .catch((error: unknown) => { if (active) setNotificationError(error instanceof Error ? error.message : "Unable to load search activity."); })
      .finally(() => { if (active) setActivityLoading(false); });
    return () => { active = false; };
  }, [readStatusKey, session.user.id]);

  useEffect(() => {
    if (readStatus?.userId !== session.user.id) return;
    try { window.localStorage.setItem(readStatusKey, JSON.stringify(readStatus.ids)); }
    catch (error) { setNotificationError(error instanceof Error ? error.message : "Unable to save notification status."); }
  }, [readStatus, readStatusKey, session.user.id]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => { if (event.target instanceof Node && !notificationMenuRef.current?.contains(event.target)) setNotificationsOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsideClick); document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, [notificationsOpen]);

  const markActivityRead = (id: string) => setReadStatus((current) => current?.userId === session.user.id && !current.ids.includes(id) ? { ...current, ids: [...current.ids, id] } : current);
  const activeLabel = language === "id" ? ({ Dashboard: "Dasbor", "Search Center": "Pusat Pencarian", "Lead Database": "Database Prospek", "Search History": "Riwayat Pencarian", Settings: "Pengaturan" } as Record<AppPage, string>)[page] : page;

  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); navigate("Dashboard"); }}><span className="brand-mark"><Target size={20} /></span><span className="brand-copy">LEAD HUNTER<small>SALES INTELLIGENCE</small></span></a>
      <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={14} /> : <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />}</button>
      <div className="nav-label">WORKSPACE</div><nav className="nav-list" aria-label="Main navigation">{navigation.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${page === name ? "active" : ""}`} onClick={() => navigate(name)} title={name}><Icon size={17} /><span>{name}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="workspace-card"><span className="workspace-avatar">{initials}</span><span className="workspace-copy">{displayName}<small>Free workspace</small></span></div><div className="sidebar-footnote">DEMO DATA · PREVIEW ENVIRONMENT</div></div>
    </aside>
    <div className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={18} /></button><div className="breadcrumb">Workspace&nbsp; / &nbsp;<strong>{activeLabel}</strong></div></div><div className="topbar-actions"><div className="notification-menu" ref={notificationMenuRef}><button className="icon-button" aria-label="Notifications" title="Notifications" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={16} />{unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}</button>{notificationsOpen && <section className="notification-dropdown"><div className="notification-heading"><strong>Notifications</strong><span>{unreadCount} unread</span></div>{activityLoading ? <p className="notification-message">Loading notifications…</p> : notificationError ? <p className="notification-message">{notificationError}</p> : activities.length === 0 ? <p className="notification-message">No recent search activity.</p> : <ul className="notification-list">{activities.map((activity) => { const isRead = readActivityIds.includes(activity.id); const details = [activity.query, activity.industry, activity.location].filter((value): value is string => Boolean(value?.trim())); return <li className={`notification-item ${isRead ? "read" : "unread"}`} key={activity.id}><span className="activity-indicator" aria-hidden="true" /><div className="activity-copy"><strong>{activity.query || "Search activity"}</strong><span>{details.join(" · ") || "Search"}</span><time>{new Date(activity.created_at).toLocaleString(language === "id" ? "id-ID" : "en-US")}</time></div>{!isRead && <button className="mark-read-button" onClick={() => markActivityRead(activity.id)}>Mark as read</button>}</li>; })}</ul>}</section>}</div><span className="top-avatar" title={displayName}>{initials}</span></div></header>
      <main className="content">{page === "Dashboard" ? <DashboardView onNavigate={navigate} displayName={displayName} /> : page === "Search Center" ? <SearchCenterView /> : page === "Lead Database" ? <LeadDatabaseView /> : page === "Search History" ? <HistoryView /> : <SettingsView onToast={showToast} />}</main>
    </div>
    {toast && <div className="toast" role="status"><Sparkles size={15} />{toast}<button aria-label="Dismiss message" onClick={() => setToast("")} style={{ marginLeft: 6, border: 0, background: "transparent", color: "#81918d" }}><X size={14} /></button></div>}
  </div>;
}

function HistoryView() {
  return <><div className="page-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h1>Search history</h1><p className="page-subtitle">Keep track of your recent lead discovery searches.</p></div><span className="demo-pill">DEMO</span></div><div className="demo-banner"><ShieldCheck size={15} /><span><strong>Demo mode</strong> · No searches have been run. Search history will appear here when the search engine is connected.</span></div><section className="panel"><div className="empty-state"><span className="empty-icon"><Clock3 size={18} /></span><strong style={{ display: "block", color: "#52697a", marginBottom: 5 }}>No search history yet</strong>Configure a search in Search Center to get started. Search execution is not available in this preview.</div></section></>;
}

function SettingsView({ onToast }: { onToast: (message: string) => void }) {
  const { language, setLanguage } = useLanguage();
  const chooseLanguage = (next: Language) => setLanguage(next);
  return <><div className="page-heading"><div><div className="eyebrow">WORKSPACE PREFERENCES</div><h1>Settings</h1><p className="page-subtitle">Manage your workspace profile and future integrations.</p></div><span className="demo-pill">PREVIEW</span></div><div className="demo-banner"><ShieldCheck size={15} /><span><strong>Prototype settings</strong> · Changes are not persisted. Backend and account integration are not configured.</span></div><div className="settings-grid"><section className="panel settings-card"><h3>Workspace</h3><p>Basic details for this demo workspace.</p><div className="settings-row"><span>Workspace name</span><strong>Acme Sales</strong></div><div className="settings-row"><span>Plan</span><strong>Free preview</strong></div><div className="settings-row"><span>Data region</span><strong>Not configured</strong></div></section><section className="panel settings-card"><h3>Language / Bahasa</h3><p>Choose the language used across Lead Hunter AI.</p><div className="settings-row language-setting"><span><strong>Current language</strong><small>{language === "en" ? "English" : "Bahasa Indonesia"}</small></span><div className="language-options" role="group" aria-label="Language / Bahasa"><button type="button" className={`btn language-option ${language === "en" ? "selected" : ""}`} aria-pressed={language === "en"} onClick={() => chooseLanguage("en")}>🇬🇧 English</button><button type="button" className={`btn language-option ${language === "id" ? "selected" : ""}`} aria-pressed={language === "id"} onClick={() => chooseLanguage("id")}>🇮🇩 Bahasa Indonesia</button></div></div><p className="language-note">Language preference saved on this device.</p></section><section className="panel settings-card"><h3>Data connectors</h3><p>Connectors are placeholders for the future search engine integration.</p>{["Business directories", "Company websites", "Search engine"].map((name) => <div className="settings-row" key={name}><span>{name}</span><button className="btn" style={{ minHeight: 29, padding: "0 9px", fontSize: 10 }} onClick={() => onToast("Connectors are not available in this frontend prototype.")}>Not connected</button></div>)}</section><section className="panel settings-card"><h3>Data &amp; privacy</h3><p>Supabase-ready architecture is planned; no user or lead data is sent to a backend in this prototype.</p><div className="settings-row"><span>Backend connection</span><strong>Not configured</strong></div><div className="settings-row"><span>Demo data</span><strong>Enabled</strong></div></section></div></>;
}
