// src/pages/Register.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "./GoogleLoginButton";

function Register() {
  const { register, authLoading, authError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const card = {
    width: "100%",
    maxWidth: 380,
    padding: 32,
    borderRadius: 20,
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(148,163,184,0.25)",
    boxShadow: "0px 12px 40px rgba(0,0,0,0.5)",
    backdropFilter: "blur(12px)",
  };

  const input = {
    width: "100%",
    padding: "12px 14px",
    marginTop: 10,
    borderRadius: 12,
    background: "rgba(2,6,23,0.65)",
    border: "1px solid rgba(148,163,184,0.3)",
    color: "#e2e8f0",
    fontSize: 14,
  };

  const button = {
    width: "100%",
    marginTop: 16,
    padding: "12px",
    borderRadius: 999,
    border: "none",
    background: authLoading
      ? "#6b7280"
      : "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: authLoading ? "not-allowed" : "pointer",
    boxShadow: "0px 0px 12px rgba(34,197,94,0.5)",
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      return alert("Fill all fields");
    }
    await register(name, email, password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top,#0f766e,#020617 75%)",
      }}
    >
      <div style={card}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            marginBottom: 20,
            background: "linear-gradient(to right,#22c55e,#4ade80)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          ✨ Create Account
        </h2>

        <input
          style={input}
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>
            {authError}
          </p>
        )}

        <button style={button} onClick={handleRegister}>
          {authLoading ? "Registering..." : "Register"}
        </button>

        <div style={{ marginTop: 16 }}>
          <GoogleLoginButton />
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#cbd5e1",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "#38bdf8",
              textDecoration: "underline",
            }}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
