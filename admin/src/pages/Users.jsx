import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { list, update, remove } from "../api";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

const DEPARTMENTS = [
  "General Administration", "Information Technology", "Human Resources", "Finance",
  "Marketing", "Sales", "Customer Service", "Legal Affairs",
];

const ALL_PERMISSIONS = [
  { id: "manage_emails", label: "Emails", key: "emails", icon: "✉️", color: "#8B5CF6" },
  { id: "manage_domains", label: "Domains", key: "domains", icon: "🌐", color: "#3B82F6" },
  { id: "manage_messages", label: "Messages", key: "messages", icon: "💬", color: "#14B8A6" },
];

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#ea580c", "#16a34a", "#4f46e5"];

const css = `
  .usr-row { transition: background .15s ease; }
  .usr-row:hover { background: #f8fafc; }
  .usr-input { border: 1px solid #dbe3ec; border-radius: 8px; padding: 7px 10px; font-size: 13px; background: #fff; outline: none; width: 100%; box-sizing: border-box; transition: border-color .15s, box-shadow .15s; }
  .usr-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
  .usr-chip { transition: all .15s ease; user-select: none; }
  .usr-chip:hover { transform: translateY(-1px); }
  .usr-del { transition: all .15s ease; }
  .usr-del:hover { background: #dc2626 !important; color: #fff !important; }
  .usr-view:hover { background: #eef2ff !important; }
  @keyframes usr-pop { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: none; } }
`;

const card = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 2px 8px rgba(15,23,42,.07)",
};

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

function avatarColor(name = "") {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// score is 0-100 (same thresholds as the backend)
function riskStyle(score) {
  const s = Number(score) || 0;
  if (s >= 60) return { bg: "#fee2e2", fg: "#991b1b", label: "Phishing" };
  
  return { bg: "#dcfce7", fg: "#166534", label: "Safe" };
}

function MiniStat({ label, value, icon, color }) {
  return (
    <div style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
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

export default function Users() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [modalData, setModalData] = useState(null); // { user, type, items, loading }

  const perPage = 15;

  const load = useCallback(async () => {
    try {
      setError("");
      const { data, total } = await list("users", {
        page,
        perPage,
        filter: q ? { q } : {},
      });
      setRows(data);
      setTotal(total);
    } catch (e) {
      setError(e.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  const getUserPermissions = (user) => {
    const raw = user.permissions || user.Permission || user.role;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [raw];
      }
    }
    return [];
  };

  const togglePermission = async (user, permissionId) => {
    const current = getUserPermissions(user);
    const updated = current.includes(permissionId)
      ? current.filter((p) => p !== permissionId)
      : [...current, permissionId];
    try {
      await update("users", user.id, { permissions: updated });
      await load();
    } catch (e) {
      alert(e.message || "Failed to update permissions");
    }
  };

  const openWorkItemsModal = async (user, perm) => {
    setModalData({ user, type: perm.key, perm, items: [], loading: true });
    try {
      const res = await list(`users/${user.id}/work-items?item_type=${perm.key}`);
      setModalData({ user, type: perm.key, perm, items: res.data || res, loading: false });
    } catch (e) {
      alert(e.message || "Failed to fetch work items");
      setModalData(null);
    }
  };

  const withDept = rows.filter((u) => u.department).length;
  const withPerms = rows.filter((u) =>
    getUserPermissions(u).some((p) => ALL_PERMISSIONS.some((x) => x.id === p))
  ).length;

  return (
    <div style={{ padding: 20, background: "#f4f7fb", minHeight: "100%" }}>
      <style>{css}</style>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(120deg, #0f172a 0%, #1e3a8a 55%, #0e7490 100%)",
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
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Users &amp; Permissions</h1>
          
        </div>

        <div style={{ position: "relative", width: "min(320px, 100%)" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.7 }}>🔍</span>
          <input
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 14px 11px 38px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.3)",
              background: "rgba(0,0,0,.14)",
              color: "#fff",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 20 }}>
        <MiniStat label="Total users" value={total} icon="👥" color="#2563eb" />
        <MiniStat label="With a department (this page)" value={withDept} icon="🏢" color="#0891b2" />
        <MiniStat label="With permissions (this page)" value={withPerms} icon="🔑" color="#7c3aed" />
      </div>

      {error && (
        <div style={{ ...card, padding: "12px 16px", marginBottom: 16, color: "#991b1b", background: "#fef2f2" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#6B7280", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <th style={{ padding: "14px 16px" }}>User</th>
                <th style={{ padding: "14px 10px", minWidth: 190 }}>Department</th>
                <th style={{ padding: "14px 10px", minWidth: 160 }}>Position</th>
                <th style={{ padding: "14px 10px" }}>Permissions</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: "#6B7280" }}>Loading users...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: "#6B7280" }}>No users found.</td></tr>
              ) : (
                rows.map((u) => {
                  const userPerms = getUserPermissions(u);
                  return (
                    <tr key={u.id} className="usr-row" style={{ borderTop: "1px solid #eef2f7" }}>
                      {/* User */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarColor(u.name), color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1F2937" }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: "14px 10px" }}>
                        <select
                          className="usr-input"
                          value={u.department || ""}
                          onChange={async (e) => {
                            try {
                              await update("users", u.id, { department: e.target.value || null });
                              await load();
                            } catch (err) {
                              alert(err.message || "Failed to update department");
                            }
                          }}
                        >
                          <option value="">Select department...</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>

                      {/* Position */}
                      <td style={{ padding: "14px 10px" }}>
                        <input
                          className="usr-input"
                          type="text"
                          defaultValue={u.position || ""}
                          placeholder="Position..."
                          onBlur={async (e) => {
                            const newPos = e.target.value;
                            if (newPos !== (u.position || "")) {
                              try {
                                await update("users", u.id, { position: newPos || null });
                                await load();
                              } catch (err) {
                                alert(err.message || "Failed to update position");
                              }
                            }
                          }}
                        />
                      </td>

                      {/* Permissions */}
                      <td style={{ padding: "14px 10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {ALL_PERMISSIONS.map((p) => {
                            const on = userPerms.includes(p.id);
                            return (
                              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button
                                  type="button"
                                  className="usr-chip"
                                  onClick={() => togglePermission(u, p.id)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "5px 12px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: `1px solid ${on ? p.color : "#dbe3ec"}`,
                                    background: on ? `${p.color}1a` : "#f8fafc",
                                    color: on ? p.color : "#94a3b8",
                                    minWidth: 112,
                                  }}
                                >
                                  <span>{p.icon}</span>
                                  <span>{p.label}</span>
                                  <span style={{ marginLeft: "auto" }}>{on ? "✓" : "+"}</span>
                                </button>
                                {on && (
                                  <button
                                    type="button"
                                    className="usr-view"
                                    onClick={() => openWorkItemsModal(u, p)}
                                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "1px solid #dbe3ec", background: "#fff", color: "#2563eb", cursor: "pointer" }}
                                  >
                                    View
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          className="usr-del"
                          onClick={() => setTarget(u)}
                          style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Pagination page={page} perPage={perPage} total={total} onChange={setPage} />
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!target}
        title="Are you sure you want to delete this employee?"
        message="This action cannot be undone."
        details={[target?.name, target?.email]}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          try {
            await remove("users", target.id);
            setTarget(null);
            load();
          } catch (e) {
            setTarget(null);
            setError(e.message || "Failed to delete user");
          }
        }}
      />

      {/* Work items modal */}
      {modalData && (
        <div
          onClick={() => setModalData(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, width: "min(760px, 100%)", maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "usr-pop .2s ease", boxShadow: "0 20px 50px rgba(0,0,0,.3)" }}
          >
            <div style={{ padding: "18px 22px", background: `linear-gradient(120deg, ${modalData.perm.color}, #1e3a8a)`, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {modalData.perm.icon} {modalData.perm.label}
                </div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{modalData.user.name}</div>
              </div>
              <button
                onClick={() => setModalData(null)}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: "auto" }}>
              {modalData.loading ? (
                <p style={{ color: "#6B7280" }}>Loading...</p>
              ) : modalData.items.length === 0 ? (
                <p style={{ color: "#6B7280", textAlign: "center", padding: 20 }}>
                  No recorded items found for this user.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6B7280", borderBottom: "2px solid #eef2f7" }}>
                      <th style={{ padding: 8 }}>ID</th>
                      <th style={{ padding: 8 }}>Content / Link</th>
                      <th style={{ padding: 8 }}>Result</th>
                      <th style={{ padding: 8 }}>Date</th>
                      <th style={{ padding: 8 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.items.map((item) => {
                      const r = riskStyle(item.score);
                      return (
                        <tr key={item.id} className="usr-row" style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: 8 }}>{item.id}</td>
                          <td style={{ padding: 8, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>
                            {item.content}
                          </td>
                          <td style={{ padding: 8 }}>
                            <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: r.bg, color: r.fg }}>
                              {r.label} · {Math.round(item.score || 0)}%
                            </span>
                          </td>
                          <td style={{ padding: 8, fontSize: 12, color: "#6B7280" }}>
                            {item.created_at ? item.created_at.split("T")[0] : "—"}
                          </td>
                          <td style={{ padding: 8 }}>
                            <Link to={`/scans/${item.id}`} style={{ fontSize: 12, color: "#2563eb" }}>
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}