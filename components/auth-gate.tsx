"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) setMessage(error.message);
        setSession(data.session);
        setLoading(false);
      }).catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Unable to read session.");
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
      return () => subscription.unsubscribe();
    } catch (error) {
      setConfigured(false);
      setMessage(error instanceof Error ? error.message : "Supabase is not configured.");
      setLoading(false);
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabase();
      const result = creating
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (creating && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  if (loading) return <div className="empty-state" role="status">Connecting to your account…</div>;
  if (session) return <>{children(session)}</>;
  return <main className="content" style={{ maxWidth: 480, margin: "10vh auto" }}><section className="search-panel"><h1>LEAD HUNTER AI</h1><p className="page-subtitle">{creating ? "Create your account" : "Sign in to your account"}</p><form onSubmit={submit} style={{ marginTop: 24 }}><div className="form-group"><label className="form-label" htmlFor="auth-email">Email</label><input id="auth-email" className="field" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="form-group"><label className="form-label" htmlFor="auth-password">Password</label><input id="auth-password" className="field" type="password" autoComplete={creating ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></div><button className="btn btn-primary" type="submit" disabled={busy || !configured}>{busy ? "Please wait…" : creating ? "Sign up" : "Sign in"}</button></form>{message && <div className="notice-box" role="alert">{message}</div>}<button className="text-link" style={{ marginTop: 16 }} onClick={() => { setCreating(!creating); setMessage(""); }}>{creating ? "Already have an account? Sign in" : "Create an account"}</button></section></main>;
}
