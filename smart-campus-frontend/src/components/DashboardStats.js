// src/components/DashboardStats.js
import React from "react";

function DashboardStats({ documents }) {
  const totalDocs = documents.length;
  const lastDoc = documents[0] || null;

  const card = {
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(30,41,59,0.55)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(148,163,184,0.2)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
    transition: "0.3s",
  };

  const hover = {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.6)",
    border: "1px solid rgba(96,165,250,0.5)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 14,
      }}
    >
      {/* Total Docs */}
      <div
        style={card}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, card)}
      >
        <div style={{ fontSize: 13, color: "#9ca3af" }}>Total Documents</div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginTop: 4,
            color: "#38bdf8",
          }}
        >
          {totalDocs}
        </div>
      </div>

      {/* Last Subject */}
      <div
        style={card}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, card)}
      >
        <div style={{ fontSize: 13, color: "#9ca3af" }}>Last Subject</div>

        <div
          style={{
            marginTop: 6,
            fontSize: 16,
            fontWeight: 600,
            color: lastDoc ? "#e5e7eb" : "#6b7280",
          }}
        >
          {lastDoc ? lastDoc.subject : "No uploads yet"}
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;
