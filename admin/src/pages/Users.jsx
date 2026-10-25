import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { list, update, remove } from "../api";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

const DEPARTMENTS = [
  "General Administration", "Information Technology", "Human Resources", "Finance",
  "Marketing", "Sales", "Customer Service", "Legal Affairs",
];

export default function Users() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);
  
  // State for the work items popup modal
  const [modalData, setModalData] = useState(null); // { user, type, items, loading }
  
  const perPage = 15;

  const ALL_PERMISSIONS = [
    { id: "manage_emails", label: "Manage Emails", key: "emails" },
    { id: "manage_domains", label: "Manage Domains", key: "domains" },
    { id: "manage_messages", label: "Manage Messages", key: "messages" },
  ];

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
    }
  }, [page, q, perPage]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setError("");
        const response = await list("users", {
          page,
          perPage,
          filter: q ? { q } : {},
        });
        if (isMounted) {
          setRows(response.data);
          setTotal(response.total);
        }
      } catch (e) {
        if (isMounted) {
          setError(e.message || "Failed to fetch users");
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [page, q, perPage]);

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
    const currentPerms = getUserPermissions(user);
    const updatedPerms = currentPerms.includes(permissionId)
      ? currentPerms.filter((p) => p !== permissionId)
      : [...currentPerms, permissionId];

    try {
      await update("users", user.id, { permissions: updatedPerms });
      await load();
    } catch (e) {
      alert(e.message || "Failed to update permissions");
    }
  };

  // Open modal and fetch user work items
  const openWorkItemsModal = async (user, type) => {
    setModalData({ user, type, items: [], loading: true });
    try {
      console.log(type);
      const res = await list(`users/${user.id}/work-items?item_type=${type}`);
      setModalData({ user, type, items: res.data || res, loading: false });
    } catch (e) {
      alert(e.message || "Failed to fetch work items");
      setModalData(null);
    }
  };

  return (
    <>
      <h1>Users & Permissions</h1>
      <input
        className="search"
        placeholder="Search name or email…"
        value={q}
        onChange={(e) => {
          setPage(1);
          setQ(e.target.value);
        }}
      />
      {error && <p className="error">{error}</p>}

      <ConfirmDialog
        open={!!target}
        title="Are you sure you want to delete this employee?"
        message="This action cannot be undone."
        details={[target?.name, target?.email]}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          await remove("users", target.id);
          setTarget(null);
          load();
        }}
      />

      {/* Work Items Popup Modal */}
      {modalData && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "700px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3> {modalData.type.toUpperCase() }</h3>
              <button onClick={() => setModalData(null)} style={{ cursor: "pointer", padding: "4px 8px" }}>✕ Close</button>
            </div>

            {modalData.loading ? (
              <p>Loading...</p>
            ) : modalData.items.length === 0 ? (
              <p>No recorded items found for this user.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>ID</th>
                    <th style={{ padding: "8px" }}>Content / Link</th>
                    <th style={{ padding: "8px" }}>Phishing Rate</th>
                    <th style={{ padding: "8px" }}>Date</th>
                    <th style={{ padding: "8px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "8px" }}>{item.id}</td>
                      <td style={{ padding: "8px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.content}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <span style={{ 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontSize: "12px",
                          backgroundColor: item.score > 0.5 ? "#fee2e2" : "#dcfce7",
                          color: item.score > 0.5 ? "#991b1b" : "#166534"
                        }}>
                          {Math.round((item.score || 0) )}%
                        </span>
                      </td>
                      <td style={{ padding: "8px", fontSize: "12px" }}>
                        {item.created_at ? item.created_at.split("T")[0] : "—"}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <Link
                          to={`/scans/${item.id}`}
                          style={{ fontSize: "12px", color: "#2563eb", textDecoration: "underline" }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button style={{ marginTop: "20px", padding: "8px 16px", cursor: "pointer" }} onClick={() => setModalData(null)}>Close Window</button>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Position</th>
            <th>Permissions & Activity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const userPerms = getUserPermissions(u);

            return (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.department || ""}
                    onChange={async (e) => {
                      const newDept = e.target.value;
                      try {
                        await update("users", u.id, { department: newDept || null });
                        await load();
                      } catch (err) {
                        alert(err.message || "Failed to update department");
                      }
                    }}
                  >
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
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
                <td>
                  <div className="permissions-grid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    {ALL_PERMISSIONS.now ? ALL_PERMISSIONS : ALL_PERMISSIONS.map((p) => {
                      const isChecked = userPerms.includes(p.id);
                      return (
                        <div key={p.id} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              backgroundColor: isChecked ? "#e0f2fe" : "#f9fafb",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(u, p.id)}
                            />
                            {p.label}
                          </label>
                          {isChecked && (
                            <button
                              onClick={() => openWorkItemsModal(u, p.key)}
                              style={{ fontSize: "11px", padding: "4px 6px", cursor: "pointer" }}
                            >
                              View {p.key}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <button className="danger" onClick={() => setTarget(u)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Pagination
        page={page}
        perPage={perPage}
        total={total}
        onChange={setPage}
      />
    </>
  );
}