"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getSupabase } from "@/lib/supabase";

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [configured, setConfigured] = useState(true);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const verificationId = useRef(0);

  const verifyOwner = useCallback(async (nextSession: Session) => {
    const requestId = ++verificationId.current;
    setSession(nextSession);
    setOwnerVerified(false);
    setLoading(true);
    setMessage("");

    let allowed = false;
    let verificationFailed = false;
    try {
      const { data, error } = await getSupabase().rpc("is_app_owner");
      allowed = !error && data === true;
      verificationFailed = Boolean(error);
    } catch {
      verificationFailed = true;
    }

    if (requestId !== verificationId.current) return;

    if (allowed) {
      setOwnerVerified(true);
      setLoading(false);
      return;
    }

    setSession(null);
    setOwnerVerified(false);
    setLoading(false);
    setMessage(verificationFailed
      ? "We couldn't verify Owner access. You have been signed out. Please try again later."
      : "Access denied. This account is not authorized to use Lead Hunter AI.");

    try {
      await getSupabase().auth.signOut();
    } catch {
      // Access remains denied in the UI even if sign-out cannot complete.
    }
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const supabase = getSupabase();
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMessage("Unable to restore your session. Please sign in again.");
          setSession(null);
          setOwnerVerified(false);
          setLoading(false);
          return;
        }
        if (data.session) {
          void verifyOwner(data.session);
        } else {
          setSession(null);
          setOwnerVerified(false);
          setLoading(false);
        }
      }).catch(() => {
        if (!active) return;
        setMessage("Unable to restore your session. Please sign in again.");
        setSession(null);
        setOwnerVerified(false);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return;
        if (nextSession) {
          setSession(nextSession);
          setOwnerVerified(false);
          setLoading(true);
          // Defer Supabase calls until after its auth-state callback has returned.
          window.setTimeout(() => {
            if (active) void verifyOwner(nextSession);
          }, 0);
        } else {
          verificationId.current += 1;
          setSession(null);
          setOwnerVerified(false);
          setLoading(false);
        }
      });

      return () => {
        active = false;
        verificationId.current += 1;
        subscription.unsubscribe();
      };
    } catch (error) {
      setConfigured(false);
      setMessage(error instanceof Error ? error.message : "Supabase is not configured.");
      setLoading(false);
    }
  }, [verifyOwner]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setMessage("");
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
      verificationId.current += 1;
      setSession(null);
      setOwnerVerified(false);
      setMessage("You have been signed out.");
    } catch {
      setMessage("Unable to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="empty-state" role="status">Verifying your account…</div>;

  if (session && ownerVerified) {
    return (
      <>
        <AppShell session={session} />
        <button
          className="btn"
          type="button"
          disabled={busy}
          onClick={logout}
          style={{ position: "fixed", right: 20, bottom: 20, zIndex: 50, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </>
    );
  }

  return (
    <main className="content" style={{ maxWidth: 480, margin: "10vh auto" }}>
      <section className="search-panel">
        <h1>LEAD HUNTER AI</h1>
        <p className="page-subtitle">Sign in to your account</p>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="field"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>
        {message && <div className="notice-box" role="alert">{message}</div>}
      </section>
    </main>
  );
}
