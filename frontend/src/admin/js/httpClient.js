import { fetchUtils } from "react-admin";

export const httpClient = async (url, options = {}) => {
  options.headers = new Headers(options.headers || { Accept: "application/json" });
  const token = localStorage.getItem("admin_token");
  if (token) options.headers.set("Authorization", `Bearer ${token}`);

  try {
    return await fetchUtils.fetchJson(url, options);
  } catch (error) {
    const detail = error.body?.detail;
    if (typeof detail === "string") {
      error.message = detail;
    } else if (Array.isArray(detail)) {
      error.message = detail.map((d) => d.msg).join(", ");
    }
    throw error;
  }
};