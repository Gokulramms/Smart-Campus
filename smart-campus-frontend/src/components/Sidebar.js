// src/components/Sidebar.js
import React from "react";
import { useAuth } from "../context/AuthContext";
import DashboardStats from "./DashboardStats";
import UploadCard from "./UploadCard";
import DocumentList from "./DocumentList";

function Sidebar({
  documents,
  selectedDocId,
  onSelectDoc,
  onRefreshDocuments,
  onUploadedDoc,
}) {
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width: "24%",
        padding: 20,
        background: "rgba(15,23,42,0.9)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(148,163,184,0.12)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        boxShadow: "4px 0 30px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 4,
            background: "linear-gradient(to right,#38bdf8,#818cf8)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          ⚡ Smart Campus Hub
        </h2>
        <p style={{ fontSize: 12, color: "#9ca3af" }}>
          Welcome,{" "}
          <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
            {user?.name || user?.email}
          </span>
        </p>
      </div>

      {/* Dashboard Stats (Glass Cards) */}
      <DashboardStats documents={documents} />

      {/* Upload Card — also upgraded */}
      <UploadCard onUploaded={onUploadedDoc} />

      {/* Document List */}
      <DocumentList
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDoc={onSelectDoc}
        onRefresh={onRefreshDocuments}
      />

      {/* Logout Button */}
      <button
        onClick={logout}
        style={{
          padding: 8,
          borderRadius: 999,
          border: "1px solid rgba(239,68,68,0.5)",
          background: "rgba(0,0,0,0.4)",
          color: "#ef4444",
          fontWeight: 600,
          cursor: "pointer",
          transition: "0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
      >
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
