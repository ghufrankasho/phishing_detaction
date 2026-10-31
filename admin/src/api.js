const API = "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");
export const getUser = () => JSON.parse(localStorage.getItem("user") || "null");
export const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); };

export async function login(email, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid email or password");
  const { token, user } = await res.json();
  if (user.role !== "admin") throw new Error("Admins only");
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (res.status === 401 || res.status === 403) {
    logout();
    window.location.href = "/login";
    throw new Error("Not authorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatError(err.detail));
  }
  const total = Number((res.headers.get("Content-Range") || "").split("/")[1] || 0);
  return { data: await res.json(), total };
}

function formatError(detail) {
  if (!detail) return "Request failed";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = d.loc?.[d.loc.length - 1];
        const msg = (d.msg || "").replace(/^Value error, /, "");
        return field && field !== "body" ? `${field}: ${msg}` : msg;
      })
      .join(" · ");
  }
  return "Request failed";
}
export const list = (resource, { page = 1, perPage = 15, sort = "id", order = "DESC", filter = {} } = {}) => {
  const start = (page - 1) * perPage;
  const qs = new URLSearchParams({
    sort: JSON.stringify([sort, order]),
    range: JSON.stringify([start, start + perPage - 1]),
    filter: JSON.stringify(filter),
  });
  return request(`/${resource}?${qs}`);
};
export const getOne = (r, id) => request(`/${r}/${id}`).then((x) => x.data);
export const create = (r, body) => request(`/${r}`, { method: "POST", body: JSON.stringify(body) });
export const update = (r, id, body) => request(`/${r}/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const remove = (r, id) => request(`/${r}/${id}`, { method: "DELETE" });

// Admin dashboard
export const getStats = () => request("/admin/stats").then((x) => x.data);

// Admin: every scan from every user (all filters are optional)
export const listScans = ({ kind = "", verdict = "", q = "", page = 1, limit = 10 } = {}) => {
  const qs = new URLSearchParams({ page, limit });
  if (kind) qs.set("kind", kind);
  if (verdict) qs.set("verdict", verdict);
  if (q) qs.set("q", q);
  return request(`/admin/scans?${qs}`).then((x) => x.data);
};

// Admin: one scan with its full content and owner
export const getScanDetail = (id) => request(`/admin/scans/${id}`).then((x) => x.data);

// Admin: delete one or many scans
export const deleteScans = (ids) =>
  request("/admin/scans/delete", { method: "POST", body: JSON.stringify({ ids }) }).then((x) => x.data);