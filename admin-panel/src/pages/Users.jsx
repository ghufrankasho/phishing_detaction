import { useEffect, useState, useCallback } from "react";
import { list, update, remove } from "../api";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);
  const perPage = 15;
  // Defined list of all assignable system permissions
  const ALL_PERMISSIONS = [
    
    { id: "manage_emails", label: "Manage Emails" },
    { id: "manage_domains", label: "Manage Domains" },
    { id: "manage_messages", label: "Manage Messages" },
   
  ];
  // Memoize load to maintain a stable reference across renders
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

  // Execute load inside useEffect with cleanup flag to prevent race conditions
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

    return () => {
      isMounted = false; // Prevents state updates on unmounted components
    };
  }, [page, q, perPage]);

  // Helper to parse saved permissions array safely
    const getUserPermissions = (user) => {
      const raw = user.permissions || user.Permission || user.role;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        try {
          // Parse JSON string if stored as '["manage_emails","manage_domains"]'
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // Fallback for single string values like "admin" or "manage_emails"
          return [raw];
        }
      }
      return [];
    };
    // Toggle a specific permission for a user
    const togglePermission = async (user, permissionId) => {
      const currentPerms = getUserPermissions(user);
      let updatedPerms;

      if (currentPerms.includes(permissionId)) {
        // Remove permission if already assigned
        updatedPerms = currentPerms.filter((p) => p !== permissionId);
      } else {
        // Add new permission
        updatedPerms = [...currentPerms, permissionId];
      }

      try {
        // Sends array of updated permissions to API
        await update("users", user.id, { permissions: updatedPerms });
        await load();
      } catch (e) {
        alert(e.message || "Failed to update permissions");
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
        title="هل أنت متأكد من حذف هذا الموظف؟"
        message=".هذا الإجراء لا يمكن التراجع عنه"
        details={[target?.name, target?.email]}
        confirmText="حذف"
        cancelText="إلغاء"
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          await remove("users", target.id);
          setTarget(null);
          load();
        }}
      />
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Permissions</th>
            <th>Created</th>
            <th></th>
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
                  <div className="permissions-grid" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {ALL_PERMISSIONS.map((p) => {
                      const isChecked = userPerms.includes(p.id);
                      return (
                        <label
                          key={p.id}
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
                      );
                    })}
                  </div>
                </td>
                <td>
                  {u.created_at
                    ? u.created_at.split("T")[0]
                    : "—"}
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