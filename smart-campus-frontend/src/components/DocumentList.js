// src/components/DocumentList.js
import React from "react";

function DocumentList({ documents, selectedDocId, onSelectDoc, onRefresh }) {
  const card = {
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(2,6,23,0.7)",
    transition: "0.3s",
  };

  return (
    <div style={{ flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>📂 Your Documents</h3>
        <button
          onClick={onRefresh}
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 8,
            background: "rgba(56,189,248,0.1)",
            color: "#38bdf8",
            border: "1px solid rgba(56,189,248,0.4)",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(56,189,248,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(56,189,248,0.1)")
          }
        >
          Refresh
        </button>
      </div>

      {/* Document List */}
      <div style={{ marginTop: 6, maxHeight: "40vh", overflowY: "auto" }}>
        {documents.length === 0 && (
          <p style={{ fontSize: 11, color: "#9ca3af" }}>
            No documents uploaded yet.
          </p>
        )}

        {documents.map((doc) => {
          const isActive = selectedDocId === doc.id;

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc)}
              style={{
                ...card,
                marginBottom: 10,
                background: isActive
                  ? "linear-gradient(135deg, rgba(29,78,216,0.8), rgba(59,130,246,0.9))"
                  : "rgba(2,6,23,0.7)",
                border: isActive
                  ? "1px solid rgba(96,165,250,0.8)"
                  : "1px solid rgba(148,163,184,0.2)",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                color: isActive ? "#fff" : "#e5e7eb",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {doc.title}
              </div>
              <div style={{ fontSize: 11, color: isActive ? "#e0e7ff" : "#9ca3af" }}>
                {doc.subject} • {doc.num_chunks} chunks
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentList;
