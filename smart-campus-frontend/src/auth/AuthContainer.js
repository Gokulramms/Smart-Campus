// src/auth/AuthContainer.js
import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import GoogleLoginButton from "./GoogleLoginButton";

function AuthContainer() {
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #1d4ed8, #020617 55%)",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: 380,
          padding: 24,
          borderRadius: 16,
          background: "rgba(15,23,42,0.95)",
          border: "1px solid #1f2937",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
        }}
      >
        <h2 style={{ marginBottom: 4, fontSize: 22, fontWeight: 700 }}>
          🎓 Smart Campus Assistant
        </h2>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          Login or create an account to store your notes, generate quizzes, and
          ask AI questions from your own documents.
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            marginBottom: 12,
            borderRadius: 999,
            border: "1px solid #1f2937",
            padding: 2,
            background: "#020617",
          }}
        >
          <button
            onClick={() => setAuthMode("login")}
            style={{
              flex: 1,
              borderRadius: 999,
              border: "none",
              padding: 6,
              fontSize: 13,
              cursor: "pointer",
              background: authMode === "login" ? "#22c55e" : "transparent",
              color: authMode === "login" ? "#020617" : "#9ca3af",
              fontWeight: 600,
            }}
          >
            Login
          </button>
          <button
            onClick={() => setAuthMode("register")}
            style={{
              flex: 1,
              borderRadius: 999,
              border: "none",
              padding: 6,
              fontSize: 13,
              cursor: "pointer",
              background: authMode === "register" ? "#38bdf8" : "transparent",
              color: authMode === "register" ? "#020617" : "#9ca3af",
              fontWeight: 600,
            }}
          >
            Sign up
          </button>
        </div>

        {authMode === "login" ? <Login /> : <Register />}

        <GoogleLoginButton />
      </div>
    </div>
  );
}

export default AuthContainer;
