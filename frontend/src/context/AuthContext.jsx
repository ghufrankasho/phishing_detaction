// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // only "loading" when there is a token to check
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));

  // On app start: if a token exists, ask the API who the user is
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    api.get("/user")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role);
    setUser(res.data.user);
  };

  const register = async (data) => {
    const res = await api.post("/register", data);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };

  const editUserName = async (newName) => {
    const res = await api.put("/user", { name: newName });
    // works whether the API returns { user: {...} } or the user object directly
    setUser(res.data.user ?? res.data);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, logout, editUserName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);