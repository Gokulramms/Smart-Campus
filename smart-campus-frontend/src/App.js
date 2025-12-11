// src/App.js
import React, { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import api from "./api/api";
import AuthContainer from "./auth/AuthContainer";
import Sidebar from "./components/Sidebar";
import Workspace from "./pages/Workspace";

function App() {
  const { user, token } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedDocMeta, setSelectedDocMeta] = useState(null);

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const data = await api.get("/documents", token);
      const docs = data.documents || [];
      setDocuments(docs);

      if (docs.length > 0) {
        // If no selection yet, select first
        if (!selectedDocId) {
          setSelectedDocId(docs[0].id);
          setSelectedDocMeta(docs[0]);
        } else {
          // ensure selection still exists
          const existing = docs.find((d) => d.id === selectedDocId);
          if (!existing) {
            setSelectedDocId(docs[0].id);
            setSelectedDocMeta(docs[0]);
          } else {
            setSelectedDocMeta(existing);
          }
        }
      } else {
        setSelectedDocId("");
        setSelectedDocMeta(null);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const handleSelectDoc = (doc) => {
    setSelectedDocId(doc.id);
    setSelectedDocMeta(doc);
  };

  const handleUploadedDoc = (data) => {
    // data: { status, doc_id, title, subject, num_chunks, created_at }
    const newDoc = {
      id: data.doc_id,
      title: data.title,
      subject: data.subject,
      num_chunks: data.num_chunks,
      created_at: data.created_at,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
    setSelectedDocMeta(newDoc);
  };

  if (!user || !token) {
    return <AuthContainer />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Sidebar
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDoc={handleSelectDoc}
        onRefreshDocuments={fetchDocuments}
        onUploadedDoc={handleUploadedDoc}
      />

      <Workspace
        selectedDocId={selectedDocId}
        selectedDocMeta={selectedDocMeta}
      />
    </div>
  );
}

export default App;
