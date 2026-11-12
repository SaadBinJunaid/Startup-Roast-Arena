// context/AuthContext.jsx
// Responsibility: keep the logged-in user in one place so any page can read it.
// It stores the JWT in localStorage and loads the user on first page load.

import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" is true until we finish checking for an existing token.
  const [loading, setLoading] = useState(true);

  // On first load: if a token exists, ask the backend who we are.
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("sra_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch {
        // Token is invalid or expired: clear it and continue as a guest.
        localStorage.removeItem("sra_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function register(name, email, password) {
    const response = await api.post("/auth/register", {
      name: name,
      email: email,
      password: password,
    });

    localStorage.setItem("sra_token", response.data.token);
    setUser(response.data.user);
    return response.data;
  }

  async function login(email, password) {
    const response = await api.post("/auth/login", {
      email: email,
      password: password,
    });

    localStorage.setItem("sra_token", response.data.token);
    setUser(response.data.user);
    return response.data;
  }

  function logout() {
    localStorage.removeItem("sra_token");
    setUser(null);
  }

  const value = {
    user: user,
    loading: loading,
    register: register,
    login: login,
    logout: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
