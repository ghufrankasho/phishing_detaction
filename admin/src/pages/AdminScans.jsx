import { useEffect, useState, useCallback } from "react";
import { listScans, getScanDetail, deleteScans } from "../api";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

const KINDS = {
  message: { title: "Messages", icon: "💬", color: "#14B8A6", hint: "Search message text, user name or email…" },
  email: { title: "Emails", icon: "✉️", color: "#8B5CF6", hint: "Search email text, user name or email…" },
  url: { title: "Domains & URLs", icon: "🌐", color: "#3B82F6", hint: "Search link, user name or email…" },
};

const VERDICTS = {
  safe: { label: "Safe", bg: "#dcfce7", fg: "#166534", bar: "#10B981" },
  phishing: { label: "Phishing", bg: "#fee2e2", fg: "#991b1b", bar: "#EF4444" },
};

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#ea580c", "#16a34a", "#4f46e5"];
const LIMIT = 10;

const css = `
  .as-row { transition: background .15s ease; }
  .as-row:hover { background: #f8fafc; }
  .as-pill { transition: all .15s ease; }
  .as-pill:hover { transform: translateY(-1px); }
  .as-act { transition: all .15s ease; }
  .as-act:hover { filter: brightness(.95); transform: translateY(-1px); }
  .as-card { transition: transform .2s ease, box-shadow .2s ease; }
  .as-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(15,23,42,.12); }
  @keyframes as-slide { from { transform: translateX(100%); } to { transform: none; } }
  @keyframes as-fade { from { opacity: 0; } to { opacity: 1; } }
`;

const card = { background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(15,23,42,.07)" };

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

function avatarColor(name = "") {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Badge({ label }) {
  const v = VERDICTS[label] || { label: label || "—", bg: "#e5e7eb", fg: "#374151" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: v.bg, color: v.fg, whiteSpace: "nowrap" }}>
      {v.label}
    </span>
  );
}

function RiskBar({ score, label, width = 90 }) {
  const v = VERDICTS[label] || VERDICTS.safe;
  const pct = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width, height: 7, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: v.bar, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, color: "#6B7280", minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="as-card" style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}1a`, display: "grid", placeItems: "center", fontSize: 22 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#6B7280" }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

export default function AdminScans({ kind = "message" }) {
  const cfg = KINDS[kind] || KINDS.message;
  const isUrl = kind === "url";

  const [verdict, setVerdict] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced search text
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [panel, setPanel] = useState(null); // { id, loading, item }
  const [toDelete, setToDelete] = useState(null); // array of ids
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Wait until the admin stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelected([]);
    listScans({ kind, verdict, q, page, limit: LIMIT })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError("");
      })
      .catch((e) => !cancelled && setError(e.message || "Failed to load scans"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [kind, verdict, q, page, reloadKey]);

  // Close the side panel with the Escape key
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = data?.items || [];
  const counts = data?.counts || { safe: 0,  phishing: 0 };
  const allCount = counts.safe  + counts.phishing;

  const pageIds = items.map((s) => s.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleOne = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelected(allSelected ? [] : pageIds);

  const openPanel = useCallback(async (id) => {
    setPanel({ id, loading: true, item: null });
    try {
      const item = await getScanDetail(id);
      setPanel({ id, loading: false, item });
    } catch (e) {
      setPanel(null);
      setError(e.message || "Failed to load details");
    }
  }, []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteScans(toDelete);
      if (panel && toDelete.includes(panel.id)) setPanel(null);
      // Deleted every row on a page after the first? Go back one page.
      if (toDelete.length >= items.length && page > 1) setPage(page - 1);
      else setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e.message || "Failed to delete");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const filters = [
    { key: "", label: "All", count: allCount },
    { key: "safe", label: "Safe", count: counts.safe },
    
    { key: "phishing", label: "Phishing", count: counts.phishing },
  ];

  return (
    <div style={{ padding: 20, background: "#f4f7fb", minHeight: "100%" }}>
      <style>{css}</style>

      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(120deg, #0f172a 0%, #1e3a8a 50%, ${cfg.color} 100%)`,
          color: "#fff",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            {cfg.icon} {cfg.title}
          </h1>
           
        </div>

        <div style={{ position: "relative", width: "min(340px, 100%)" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.7 }}>🔍</span>
          <input
            placeholder={cfg.hint}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 14px 11px 38px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.3)",
              background: "rgba(255,255,255,.14)",
              color: "#fff",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Counts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total" value={allCount} icon={cfg.icon} color={cfg.color} />
        <StatCard label="Safe" value={counts.safe} icon="✅" color="#10B981" />
         <StatCard label="Phishing" value={counts.phishing} icon="🛡️" color="#EF4444" />
      </div>

      {error && (
        <div style={{ ...card, padding: "12px 16px", marginBottom: 16, color: "#991b1b", background: "#fef2f2" }}>
          {error}
        </div>
      )}

      <div style={{ ...card, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eef2f7" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {filters.map((f) => {
              const on = verdict === f.key;
              return (
                <button
                  key={f.key || "all"}
                  type="button"
                  className="as-pill"
                  onClick={() => {
                    setVerdict(f.key);
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${on ? cfg.color : "#dbe3ec"}`,
                    background: on ? `${cfg.color}1a` : "#fff",
                    color: on ? cfg.color : "#64748b",
                  }}
                >
                  {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <button
              type="button"
              className="as-act"
              onClick={() => setToDelete(selected)}
              disabled={deleting}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              🗑 Delete selected ({selected.length})
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", opacity: loading && data ? 0.6 : 1, transition: "opacity .15s" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#6B7280", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <th style={{ padding: "12px 16px", width: 36 }}>
                  <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} />
                </th>
                <th style={{ padding: "12px 10px" }}>User</th>
                {isUrl && <th style={{ padding: "12px 10px" }}>Domain</th>}
                <th style={{ padding: "12px 10px" }}>Content</th>
                <th style={{ padding: "12px 10px" }}>Result</th>
                <th style={{ padding: "12px 10px" }}>Risk</th>
                <th style={{ padding: "12px 10px" }}>Date</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data && loading ? (
                <tr><td colSpan={isUrl ? 8 : 7} style={{ padding: 30, textAlign: "center", color: "#6B7280" }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={isUrl ? 8 : 7} style={{ padding: 30, textAlign: "center", color: "#6B7280" }}>No items found.</td></tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="as-row" style={{ borderTop: "1px solid #eef2f7", background: selected.includes(s.id) ? "#eff6ff" : undefined }}>
                    <td style={{ padding: "12px 16px" }}>
                      <input type="checkbox" aria-label="Select" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)} />
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColor(s.user_name), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {initials(s.user_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1F2937" }}>{s.user_name}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>{s.user_email}</div>
                        </div>
                      </div>
                    </td>
                    {isUrl && <td style={{ padding: "12px 10px", fontWeight: 600, color: "#1F2937" }}>{s.domain || "—"}</td>}
                    <td
                      onClick={() => openPanel(s.id)}
                      title="Click to view"
                      style={{ padding: "12px 10px", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#475569", cursor: "pointer" }}
                    >
                      {s.preview}
                    </td>
                    <td style={{ padding: "12px 10px" }}><Badge label={s.label} /></td>
                    <td style={{ padding: "12px 10px" }}><RiskBar score={s.score} label={s.label} /></td>
                    <td style={{ padding: "12px 10px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="as-act"
                        onClick={() => openPanel(s.id)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #dbe3ec", background: "#fff", color: "#2563eb", cursor: "pointer", fontSize: 13, marginInlineEnd: 6 }}
                      >
                        👁 View
                      </button>
                      <button
                        type="button"
                        className="as-act"
                        onClick={() => setToDelete([s.id])}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 13 }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Pagination page={page} perPage={LIMIT} total={data?.total || 0} onChange={setPage} />
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!toDelete}
        title="Are you sure you want to delete the selected items?"
        message="This action cannot be undone."
        details={[toDelete ? `Items to delete: ${toDelete.length}` : null]}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />

      {/* Side panel */}
      {panel && (
        <div
          onClick={() => setPanel(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 900, animation: "as-fade .2s ease" }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(480px, 100%)",
              background: "#fff",
              boxShadow: "-10px 0 40px rgba(0,0,0,.25)",
              display: "flex",
              flexDirection: "column",
              animation: "as-slide .25s ease",
            }}
          >
            <div style={{ padding: "18px 22px", background: `linear-gradient(120deg, ${cfg.color}, #1e3a8a)`, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{cfg.icon} Scan #{panel.id}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{cfg.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setPanel(null)}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 22, overflowY: "auto", flex: 1 }}>
              {panel.loading || !panel.item ? (
                <p style={{ color: "#6B7280" }}>Loading...</p>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <Badge label={panel.item.label} />
                    <RiskBar score={panel.item.score} label={panel.item.label} width={160} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, background: "#f8fafc", marginBottom: 18 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: avatarColor(panel.item.user_name), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>
                      {initials(panel.item.user_name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1F2937" }}>{panel.item.user_name}</div>
                      <div style={{ fontSize: 13, color: "#6B7280" }}>{panel.item.user_email}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Date</div>
                  <div style={{ marginBottom: 16, color: "#1F2937" }}>
                    {panel.item.created_at ? new Date(panel.item.created_at).toLocaleString() : "—"}
                  </div>

                  {panel.item.domain && (
                    <>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Domain</div>
                      <div style={{ marginBottom: 16, fontWeight: 600, color: "#1F2937" }}>{panel.item.domain}</div>
                    </>
                  )}

                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Full content</div>
                  <div
                    dir="auto"
                    style={{ padding: 14, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14, color: "#1F2937", maxHeight: 340, overflowY: "auto" }}
                  >
                    {panel.item.content}
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #eef2f7", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPanel(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dbe3ec", background: "rgb(54 51 51)", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                className="as-act"
                onClick={() => setToDelete([panel.id])}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                🗑 Delete
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}