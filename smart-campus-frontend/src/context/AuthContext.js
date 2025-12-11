// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";
import {
  saveAuthToStorage,
  loadAuthFromStorage,
  clearAuthFromStorage,
} from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Load from storage
  useEffect(() => {
    const stored = loadAuthFromStorage();
    if (stored.token && stored.user) {
      setToken(stored.token);
      setUser(stored.user);
    }
  }, []);

  const saveAuth = (accessToken, userObj) => {
    setToken(accessToken);
    setUser(userObj);
    saveAuthToStorage(accessToken, userObj);
  };

  const logout = () => {
    clearAuthFromStorage();
    setToken(null);
    setUser(null);
  };

  const handleAuth = async (endpoint, payload) => {
    setAuthError("");
    setAuthLoading(true);

    try {
      const data = await api.post(endpoint, payload);
      if (!data.access_token || !data.user) {
        throw new Error("Invalid server response.");
      }
      saveAuth(data.access_token, data.user);
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const login = (email, password) =>
    handleAuth("/auth/login", { email, password });

  const register = (name, email, password) =>
    handleAuth("/auth/register", { name, email, password });

  const loginWithGoogle = (credential) =>
    handleAuth("/auth/google", { credential });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        authError,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
