// src/pages/Login.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "./GoogleLoginButton";

function Login() {
  const { login, authLoading, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const card = {
    width: "100%",
    maxWidth: 380,
    padding: 32,
    borderRadius: 20,
    background: "rgba(15,23,42,0.75)",
    border: "1px solid rgba(148,163,184,0.25)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
  };

  const input = {
    width: "100%",
    padding: "12px 14px",
    marginTop: 10,
    borderRadius: 12,
    background: "rgba(2,6,23,0.65)",
    border: "1px solid rgba(148,163,184,0.3)",
    color: "#e2e8f0",
    transition: "0.25s",
    fontSize: 14,
  };

  const button = {
    width: "100%",
    marginTop: 14,
    padding: "12px",
    borderRadius: 999,
    border: "none",
    background: authLoading
      ? "#475569"
      : "linear-gradient(135deg,#3b82f6,#2563eb)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: authLoading ? "not-allowed" : "pointer",
    boxShadow: "0px 0px 12px rgba(59,130,246,0.5)",
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Enter email & password");
    await login(email, password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top,#1e3a8a,#020617 70%)",
      }}
    >
      <div style={card}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            marginBottom: 20,
            background: "linear-gradient(to right,#38bdf8,#818cf8)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          🔐 Login
        </h2>

        <input
          style={input}
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          style={input}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {authError && (
          <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>
            {authError}
          </p>
        )}

        <button style={button} onClick={handleLogin}>
          {authLoading ? "Logging in..." : "Login"}
        </button>

        <div style={{ marginTop: 12 }}>
          <GoogleLoginButton />
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#cbd5e1",
            textAlign: "center",
          }}
        >
          Don’t have an account?{" "}
          <a
            href="/register"
            style={{
              color: "#38bdf8",
              textDecoration: "underline",
            }}
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
