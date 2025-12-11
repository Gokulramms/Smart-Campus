// src/components/UploadCard.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function UploadCard({ onUploaded }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("subject", subject || "General");

    setUploadLoading(true);
    setUploadMessage("");

    try {
      const data = await api.upload("/upload", formData, token);

      if (data.status === "ok") {
        setUploadMessage("🎉 Uploaded successfully!");
        setTitle("");
        setSubject("");
        setFile(null);
        onUploaded?.(data);
      } else {
        setUploadMessage("❌ Upload failed.");
      }
    } catch (err) {
      setUploadMessage("❌ Upload failed, check backend.");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "rgba(15,23,42,0.65)",
        border: "1px solid rgba(148,163,184,0.25)",
        backdropFilter: "blur(12px)",
        boxShadow: "0px 8px 25px rgba(0,0,0,0.4)",
      }}
    >
      <h3
        style={{
          marginBottom: 10,
          fontSize: 15,
          fontWeight: 700,
          color: "#e2e8f0",
        }}
      >
        ⬆ Upload Notes
      </h3>

      <label style={label}>Title</label>
      <input
        style={input}
        placeholder="e.g., DS Unit 1"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label style={label}>Subject</label>
      <input
        style={input}
        placeholder="e.g., Data Structures"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      {/* Drag & Drop */}
      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          marginTop: 10,
          padding: "20px",
          borderRadius: 14,
          border: file
            ? "2px solid #22c55e"
            : "2px dashed rgba(148,163,184,0.4)",
          background: "rgba(2,6,23,0.4)",
          textAlign: "center",
          cursor: "pointer",
          color: file ? "#22c55e" : "#9ca3af",
          transition: "0.25s",
        }}
      >
        {file ? `📄 ${file.name}` : "Drag & drop PDF here or click"}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: "none" }}
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploadLoading}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "10px",
          borderRadius: 999,
          background: uploadLoading
            ? "#475569"
            : "linear-gradient(135deg,#22c55e,#16a34a)",
          border: "none",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: uploadLoading ? "not-allowed" : "pointer",
          boxShadow: "0 0 15px rgba(34,197,94,0.5)",
          transition: "0.2s",
        }}
      >
        {uploadLoading ? "Processing..." : "Upload & Index"}
      </button>

      {uploadMessage && (
        <p style={{ marginTop: 10, fontSize: 12, color: "#a5b4fc" }}>
          {uploadMessage}
        </p>
      )}
    </div>
  );
}

const label = {
  fontSize: 12,
  marginTop: 6,
  display: "block",
  color: "#cbd5e1",
};

const input = {
  width: "100%",
  padding: "8px",
  marginTop: 4,
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.3)",
  background: "rgba(2,6,23,0.7)",
  color: "#e2e8f0",
};

export default UploadCard;
