"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardView } from "@/components/dashboard-view";
import { LeadDatabaseView } from "@/components/lead-database-view";
import { SearchCenterView } from "@/components/search-center-view";
import { SearchHistoryView } from "@/components/search-history-view";
import { getSupabase } from "@/lib/supabase";
import { useLanguage, type Language } from "@/lib/language-context";
import type { AppPage } from "@/lib/types";

const navigation: { name: AppPage; icon: LucideIcon }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Search Center", icon: Search },
  { name: "Lead Database", icon: Database },
  { name: "Search History", icon: Clock3 },
  { name: "Settings", icon: Settings },
];

function displayName(session: Session) {
  const meta = session.user.user_metadata;

  return (
    [
      meta.full_name,
      meta.name,
      meta.display_name,
    ].find(
      (item): item is string =>
        typeof item === "string" && !!item.trim()
    )?.trim() || "Workspace"
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({ session }: { session: Session }) {
  const [page, setPage] = useState<AppPage>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState("");

  const { language, setLanguage } = useLanguage();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const name = displayName(session);

  const navigate = (next: AppPage) => {
    setPage(next);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!notificationsOpen) return;

    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !notificationsRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);

    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [notificationsOpen]);

  async function signOut() {
    setSigningOut(true);

    try {
      const { error } = await getSupabase().auth.signOut();

      if (error) throw error;
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Unable to sign out."
      );

      setSigningOut(false);
    }
  }

  const labels: Record<AppPage, string> =
    language === "id"
      ? {
          Dashboard: "Dasbor",
          "Search Center": "Pusat Pencarian",
          "Lead Database": "Database Prospek",
          "Search History": "Riwayat Pencarian",
          Settings: "Pengaturan",
        }
      : {
          Dashboard: "Dashboard",
          "Search Center": "Search Center",
          "Lead Database": "Lead Database",
          "Search History": "Search History",
          Settings: "Settings",
        };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          collapsed ? "collapsed" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-header">
          <a
            className="brand"
            href="#dashboard"
            onClick={(event) => {
              event.preventDefault();
              navigate("Dashboard");
            }}
          >
            <span className="brand-mark">
              <Target size={20} />
            </span>

            <span className="brand-copy">
              LEAD HUNTER
              <small>SALES INTELLIGENCE</small>
            </span>
          </a>

          <button
            className="collapse-button"
            type="button"
            onClick={() =>
              setCollapsed((value) => !value)
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav
          className="nav-list"
          aria-label="Main navigation"
        >
          {navigation.map(({ name: item, icon: Icon }) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${
                page === item ? "active" : ""
              }`}
              aria-current={
                page === item ? "page" : undefined
              }
              title={labels[item]}
              onClick={() => navigate(item)}
            >
              <Icon size={17} />
              <span>{labels[item]}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-card">
            <span className="workspace-avatar">
              {initials(name)}
            </span>

            <span className="workspace-copy">
              {name}
              <small>Authenticated workspace</small>
            </span>
          </div>

          <button
            className="signout-button"
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
          >
            <LogOut size={15} />
            <span>
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </button>

            <div className="breadcrumb">
              Workspace
              <span>›</span>
              <strong>{labels[page]}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div
              className="notification-menu"
              ref={notificationsRef}
            >
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() =>
                  setNotificationsOpen((value) => !value)
                }
              >
                <Bell size={16} />
              </button>

              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-heading">
                    Workspace updates
                  </div>

                  <p className="notification-message">
                    Search activity is available in Search History.
                  </p>

                  <button
                    className="text-link"
                    type="button"
                    onClick={() => {
                      navigate("Search History");
                      setNotificationsOpen(false);
                    }}
                  >
                    Open search history
                  </button>
                </div>
              )}
            </div>

            <span className="top-avatar" title={name}>
              {initials(name)}
            </span>
          </div>
        </header>

        <main className="content">
          {page === "Dashboard" ? (
            <DashboardView
              onNavigate={navigate}
              displayName={name}
            />
          ) : page === "Search Center" ? (
            <SearchCenterView />
          ) : page === "Lead Database" ? (
            <LeadDatabaseView />
          ) : page === "Search History" ? (
            <SearchHistoryView />
          ) : (
            <SettingsView
              language={language}
              setLanguage={setLanguage}
              email={session.user.email || ""}
            />
          )}
        </main>
      </div>

      {notice && (
        <div className="toast" role="alert">
          {notice}
          <button
            className="text-link"
            type="button"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsView({
  language,
  setLanguage,
  email,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
  email: string;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            WORKSPACE PREFERENCES
          </div>

          <h1>Settings</h1>

          <p className="page-subtitle">
            Manage your account and application preferences.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel settings-card">
          <h3>Account</h3>

          <p>
            Current authenticated Supabase account.
          </p>

          <div className="settings-row">
            <span>Email</span>
            <strong>{email || "Unavailable"}</strong>
          </div>

          <div className="settings-row">
            <span>Authentication</span>
            <strong>Active session</strong>
          </div>
        </section>

        <section className="panel settings-card">
          <h3>Language</h3>

          <p>
            Choose the language used across Lead Hunter AI.
          </p>

          <div className="settings-row language-setting">
            <span>Language preference</span>

            <div className="language-options">
              <button
                type="button"
                aria-pressed={language === "en"}
                className={`btn language-option ${
                  language === "en" ? "selected" : ""
                }`}
                onClick={() => setLanguage("en")}
              >
                English
              </button>

              <button
                type="button"
                aria-pressed={language === "id"}
                className={`btn language-option ${
                  language === "id" ? "selected" : ""
                }`}
                onClick={() => setLanguage("id")}
              >
                Bahasa Indonesia
              </button>
            </div>
          </div>

          <p className="language-note">
            Preference is saved on this device.
          </p>
        </section>

        <section className="panel settings-card">
          <h3>Data sources</h3>

          <p>
            OpenStreetMap is the currently available live
            business discovery integration. Other providers
            are not connected.
          </p>

          <div className="settings-row">
            <span>OpenStreetMap / Overpass</span>
            <strong>Available</strong>
          </div>
        </section>
      </div>
    </>
  );
}
