// src/components/Tabs.js
import React from "react";

function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "qa", label: "Ask AI" },
    { id: "summary", label: "Smart Summary" },
    { id: "quiz", label: "Practice Quiz" },
    { id: "docs", label: "Document Info" },
  ];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 14,
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(148,163,184,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              border: "1px solid rgba(148,163,184,0.2)",
              background: isActive
                ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                : "rgba(2,6,23,0.6)",
              color: isActive ? "#fff" : "#cbd5e1",
              cursor: "pointer",
              transition: "0.25s",
              transform: isActive ? "scale(1.05)" : "scale(1)",
              boxShadow: isActive
                ? "0px 0px 15px rgba(59,130,246,0.6)"
                : "none",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
