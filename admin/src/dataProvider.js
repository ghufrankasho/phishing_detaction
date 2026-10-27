import { fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const httpClient = (url, options = {}) => {
  options.headers = new Headers(options.headers || { Accept: "application/json" });
  options.headers.set("Authorization", `Bearer ${localStorage.getItem("token")}`);
  return fetchUtils.fetchJson(url, options);
};

export const dataProvider = simpleRestProvider("http://localhost:8000/admin", httpClient);