const API = "http://localhost:8000";

export const authProvider = {
  login: async ({ username, password }) => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const { token, user } = await res.json();
    if (user.role !== "admin") throw new Error("Admins only");
    localStorage.setItem("admin_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },
  checkAuth: () => (localStorage.getItem("admin_token") ? Promise.resolve() : Promise.reject()),
  checkError: ({ status }) =>
    status === 401 || status === 403 ? Promise.reject() : Promise.resolve(),
  getIdentity: () => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return Promise.resolve({ id: u.id, fullName: u.name });
  },
  getPermissions: () => Promise.resolve(JSON.parse(localStorage.getItem("user") || "{}").role),
};