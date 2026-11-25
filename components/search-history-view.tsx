"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { listSearchHistory } from "@/lib/database";

type HistoryRow = { id: string; query?: string | null; industry?: string | null; location?: string | null; created_at?: string | null; filters?: Record<string, unknown> | null; result_count?: number | null };
const dateLabel = (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Date unavailable";
function countFor(row: HistoryRow) { return row.result_count ?? (typeof row.filters?.resultCount === "number" ? row.filters.resultCount : null); }

export function SearchHistoryView() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await listSearchHistory(200) as HistoryRow[]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load search history."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);
  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h1>Search history</h1><p className="page-subtitle">Review real searches saved to your workspace.</p></div><button className="btn" type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} />{loading ? "Refreshing…" : "Refresh"}</button></div>
    {error && <div className="notice-box" role="alert"><span>{error}</span><button className="text-link" type="button" onClick={() => void refresh()}>Try again</button></div>}
    <section className="panel database-panel"><div className="panel-heading"><div><div className="panel-title">Recent searches</div><div className="panel-description">Up to 200 most recent records</div></div></div>
      {loading ? <div className="empty-state" role="status">Loading search history…</div> : error ? null : rows.length === 0 ? <div className="empty-state">No searches have been recorded yet.</div> : <>
        <div className="recent-table-wrap"><table className="table"><thead><tr><th>Keywords</th><th>Industry</th><th>Location</th><th>Results</th><th>Source</th><th>Date</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td>{row.query?.trim() || "—"}</td><td>{row.industry?.trim() || "—"}</td><td>{row.location?.trim() || "—"}</td><td>{countFor(row) ?? "Not recorded"}</td><td>{Array.isArray(row.filters?.sources) ? (row.filters.sources as string[]).join(", ") || "—" : "—"}</td><td>{dateLabel(row.created_at)}</td></tr>)}</tbody></table></div>
        <div className="table-footer"><span>{rows.length} searches</span><div className="history-pagination"><button className="btn" type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><span>Page {page + 1} of {Math.max(1, Math.ceil(rows.length / pageSize))}</span><button className="btn" type="button" disabled={(page + 1) * pageSize >= rows.length} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
      </>}
    </section>
  </>;
}
