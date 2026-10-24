import { useEffect, useState, useCallback } from "react";
import { list, create, update, remove } from "../api";
import Pagination from "../components/Pagination";

export default function Domains() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [form, setForm] = useState({
    domain: "",
    list_type: "blacklist",
    notes: "",
  });
  const [error, setError] = useState("");
  const perPage = 15;

  // Memoized load function to safely trigger re-fetches after CRUD actions
  const load = useCallback(async () => {
    try {
      setError("");
      const { data, total } = await list("domain_lists", {
        page,
        perPage,
        filter: type ? { list_type: type } : {},
      });
      setRows(data);
      setTotal(total);
    } catch (err) {
      setError(err.message || "Failed to load domain lists");
    }
  }, [page, type, perPage]);

  // Effect handles fetching with cleanup guard to prevent memory leaks/race conditions
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setError("");
        const { data, total } = await list("domain_lists", {
          page,
          perPage,
          filter: type ? { list_type: type } : {},
        });
        if (isMounted) {
          setRows(data);
          setTotal(total);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load domain lists");
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [page, type, perPage]);

  const add = async (e) => {
    e.preventDefault();
    try {
      await create("domain_lists", form);
      setForm({ domain: "", list_type: "blacklist", notes: "" });
      await load();
    } catch (err) {
      alert(err.message || "Failed to add domain");
    }
  };

  const toggle = async (d) => {
    try {
      await update("domain_lists", d.id, {
        list_type: d.list_type === "whitelist" ? "blacklist" : "whitelist",
      });
      await load();
    } catch (err) {
      alert(err.message || "Failed to update domain list type");
    }
  };

  const del = async (d) => {
    if (!confirm(`Remove ${d.domain}?`)) return;
    try {
      await remove("domain_lists", d.id);
      await load();
    } catch (err) {
      alert(err.message || "Failed to delete domain");
    }
  };

  return (
    <>
      <h1>Domains</h1>

      <form className="card inline-form" onSubmit={add}>
        <input
          required
          placeholder="example.com"
          value={form.domain}
          onChange={(e) => setForm({ ...form, domain: e.target.value })}
        />
        <select
          value={form.list_type}
          onChange={(e) => setForm({ ...form, list_type: e.target.value })}
        >
          <option value="blacklist">Blacklist</option>
          <option value="whitelist">Whitelist</option>
        </select>
        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="filters">
        <select
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
        >
          <option value="">All lists</option>
          <option value="whitelist">Whitelist</option>
          <option value="blacklist">Blacklist</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>List</th>
            <th>Notes</th>
            <th>Added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td>{d.domain}</td>
              <td>
                <span className={`badge ${d.list_type}`}>{d.list_type}</span>
              </td>
              <td>{d.notes || "—"}</td>
              <td>
                {d.created_at
                  ? new Date(d.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td>
                <button onClick={() => toggle(d)}>Switch list</button>{" "}
                <button className="danger" onClick={() => del(d)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
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