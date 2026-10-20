// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app start: if a token exists, ask the API who the user is
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);

    api.get("/user")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
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
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  const editUserName = async (newName) => {
    const token = localStorage.getItem("token");

    const res = (await api.put("/user", { name: newName })).
      headers.Authorization = `Bearer ${token}`
    setUser(res.data.user);
    console.log(user);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, editUserName }}>

      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);