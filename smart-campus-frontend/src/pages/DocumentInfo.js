// src/pages/DocumentInfo.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function DocumentInfo() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);

  useEffect(() => {
    if (!token) return;

    api.get("/documents", token)
      .then((res) => {
        setDocuments(res.documents || []);
        if (res.documents?.length > 0) setLastDoc(res.documents[0]);
      })
      .catch(() => console.error("Failed to fetch document info"));
  }, [token]);

  const totalDocs = documents.length;

  return (
    <div
      style={{
        padding: 20,
        background: "rgba(2,6,23,0.6)",
        borderRadius: 18,
        border: "1px solid rgba(148,163,184,0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 12,
          background: "linear-gradient(to right,#38bdf8,#818cf8)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        📊 Document Overview
      </h3>

      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: "rgba(15,23,42,0.75)",
          border: "1px solid rgba(148,163,184,0.2)",
          color: "#e5e7eb",
        }}
      >
        <p style={{ fontSize: 15 }}>
          Total documents:{" "}
          <b style={{ color: "#38bdf8" }}>{totalDocs}</b>
        </p>

        {!lastDoc && (
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 10 }}>
            No documents uploaded yet.
          </p>
        )}

        {lastDoc && (
          <>
            <p style={{ fontSize: 15, marginTop: 10 }}>
              Latest Upload:{" "}
              <b style={{ color: "#a5b4fc" }}>{lastDoc.title}</b>
            </p>

            <div style={{ marginTop: 10, color: "#9ca3af", fontSize: 13 }}>
              <p>Subject: {lastDoc.subject}</p>
              <p>Chunks: {lastDoc.num_chunks}</p>
              <p>
                Uploaded on:{" "}
                {new Date(lastDoc.created_at).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentInfo;
