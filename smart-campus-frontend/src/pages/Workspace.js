// src/pages/Workspace.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import Tabs from "../components/Tabs";
import DocumentInfo from "./DocumentInfo";

/* ==========================================================
   Helper: Normalize option / answer text to a single letter
========================================================== */
function normalizeLetter(str) {
  return String(str || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "") // keep only letters
    .charAt(0); // first letter only
}

/* ==========================================================
   Main Workspace Component
========================================================== */
function Workspace({ selectedDocMeta, selectedDocId }) {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState("qa");

  // ====== ASK AI STATE ======
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);

  // ====== SUMMARY STATE ======
  const [summaryFocus, setSummaryFocus] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [markType, setMarkType] = useState("2"); // "2", "5", "15"
  const [summaryMarkTypeUsed, setSummaryMarkTypeUsed] = useState(null);

  // ====== QUIZ STATE ======
  const [quizCount, setQuizCount] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizStats, setQuizStats] = useState({ answered: 0, correct: 0 });

  // ====== SHARE CREATE STATE ======
  const [shareCreatedCode, setShareCreatedCode] = useState("");
  const [shareCreatedType, setShareCreatedType] = useState("");
  const [shareCreateLoading, setShareCreateLoading] = useState(false);
  const [shareCreateError, setShareCreateError] = useState("");

  // ====== SHARE LOAD STATE ======
  const [shareCodeInput, setShareCodeInput] = useState("");
  const [shareCodeLoading, setShareCodeLoading] = useState(false);
  const [shareCodeError, setShareCodeError] = useState("");
  const [loadedShareInfo, setLoadedShareInfo] = useState(null); // {code,type}

  // ====== KEYBOARD SHORTCUTS (1/2/3/4 TO SWITCH TABS) ======
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "1") setActiveTab("qa");
      if (e.key === "2") setActiveTab("summary");
      if (e.key === "3") setActiveTab("quiz");
      if (e.key === "4") setActiveTab("docs");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const cardStyle = {
    padding: 20,
    background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.25)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.5)",
    backdropFilter: "blur(14px)",
  };

  const lastDocText = selectedDocMeta
    ? `${selectedDocMeta.title} (${selectedDocMeta.subject})`
    : "No document selected";

  const quizAccuracy =
    quizStats.answered > 0
      ? Math.round((quizStats.correct / quizStats.answered) * 100)
      : 0;

  // ================== ASK ==================
  const handleAsk = async () => {
    if (!selectedDocId) {
      alert("Please select a document first.");
      return;
    }
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }

    setAnswer("");
    setAnswerLoading(true);
    setShareCreatedCode("");
    setShareCreatedType("");
    setShareCreateError("");

    try {
      const data = await api.post(
        "/ask",
        { doc_id: selectedDocId, question },
        token
      );

      if (data.status === "ok") {
        setAnswer(data.answer);
      } else {
        setAnswer(
          "Error: " + (data.detail || data.message || "Something went wrong")
        );
      }
    } catch (err) {
      console.error(err);
      setAnswer("Error: Could not reach backend.");
    } finally {
      setAnswerLoading(false);
    }
  };

  // ================== SUMMARY ==================
  const handleSummarize = async () => {
    if (!selectedDocId) {
      alert("Please select a document first.");
      return;
    }

    setSummary("");
    setSummaryLoading(true);
    setShareCreatedCode("");
    setShareCreatedType("");
    setShareCreateError("");
    setSummaryMarkTypeUsed(null);

    try {
      const data = await api.post(
        "/summarize",
        {
          doc_id: selectedDocId,
          focus: summaryFocus || null,
          mark_type: markType,
        },
        token
      );

      if (data.status === "ok") {
        setSummary(data.summary);
        setSummaryMarkTypeUsed(data.mark_type || markType);
      } else {
        setSummary(
          "Error: " + (data.detail || data.message || "Something went wrong")
        );
      }
    } catch (err) {
      console.error(err);
      setSummary("Error: Could not reach backend.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // ================== QUIZ ==================
  const handleQuiz = async () => {
    if (!selectedDocId) {
      alert("Please select a document first.");
      return;
    }

    const count = Number(quizCount) || 5;

    setQuiz([]);
    setQuizStats({ answered: 0, correct: 0 });
    setQuizLoading(true);
    setShareCreatedCode("");
    setShareCreatedType("");
    setShareCreateError("");

    try {
      const data = await api.post(
        "/quiz",
        { doc_id: selectedDocId, num_questions: count },
        token
      );

      if (data.status === "ok" && Array.isArray(data.quiz)) {
        setQuiz(data.quiz);
      } else {
        alert(
          "Quiz error: " +
            (data.detail || data.message || "Something went wrong")
        );
      }
    } catch (err) {
      console.error(err);
      alert("Quiz error: Could not reach backend.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswered = (isCorrect) => {
    setQuizStats((prev) => ({
      answered: prev.answered + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
  };

  const handleResetQuiz = () => {
    setQuiz([]);
    setQuizStats({ answered: 0, correct: 0 });
    setShareCreatedCode("");
    setShareCreatedType("");
    setShareCreateError("");
  };

  // ================== SHARE: CREATE CODE ==================
  const handleCreateShareCode = async (type) => {
    try {
      setShareCreateError("");
      setShareCreatedCode("");
      setShareCreatedType("");
      setShareCreateLoading(true);

      let content = null;

      if (type === "ask") {
        if (!answer.trim()) {
          alert("No answer to share yet. Ask a question first.");
          return;
        }
        content = {
          question: question || "",
          answer: answer || "",
        };
      } else if (type === "summary") {
        if (!summary.trim()) {
          alert("No summary to share yet. Generate a summary first.");
          return;
        }
        content = {
          focus: summaryFocus || "",
          summary: summary || "",
          mark_type: summaryMarkTypeUsed || markType,
        };
      } else if (type === "quiz") {
        if (!quiz || quiz.length === 0) {
          alert("No quiz to share yet. Generate a quiz first.");
          return;
        }
        content = {
          quiz: quiz,
        };
      } else {
        alert("Invalid share type.");
        return;
      }

      const payload = {
        type,
        content,
      };

      const data = await api.shareCreate(payload, token);
      if (data.status === "ok" && data.code) {
        setShareCreatedCode(data.code);
        setShareCreatedType(type);
      } else {
        setShareCreateError(
          data.detail || data.message || "Failed to create share code."
        );
      }
    } catch (err) {
      console.error(err);
      setShareCreateError(err.message || "Failed to create share code.");
    } finally {
      setShareCreateLoading(false);
    }
  };

  const handleCopyShareCode = async () => {
    if (!shareCreatedCode) return;
    try {
      await navigator.clipboard.writeText(shareCreatedCode);
      alert("Code copied to clipboard: " + shareCreatedCode);
    } catch {
      alert("Could not copy code. Please copy manually.");
    }
  };

  // ================== SHARE: LOAD BY CODE ==================
  const handleLoadShareCode = async () => {
    const code = (shareCodeInput || "").trim();
    if (!code) {
      alert("Please enter a 6-digit code.");
      return;
    }
    if (code.length !== 6) {
      alert("Code must be 6 digits.");
      return;
    }

    setShareCodeError("");
    setLoadedShareInfo(null);
    setShareCodeLoading(true);

    try {
      const data = await api.shareGet(code, token);

      if (data.status !== "ok") {
        setShareCodeError(
          data.detail || data.message || "Could not load shared content."
        );
        return;
      }

      const { type, content } = data;

      if (!type || !content) {
        setShareCodeError("Invalid shared content format.");
        return;
      }

      setShareCreatedCode("");
      setShareCreatedType("");
      setShareCreateError("");

      if (type === "ask") {
        setActiveTab("qa");
        setQuestion(content.question || "");
        setAnswer(content.answer || "");
      } else if (type === "summary") {
        setActiveTab("summary");
        setSummaryFocus(content.focus || "");
        setSummary(content.summary || "");
        const m = content.mark_type || "2";
        setMarkType(m);
        setSummaryMarkTypeUsed(m);
      } else if (type === "quiz") {
        setActiveTab("quiz");
        const loadedQuiz = Array.isArray(content.quiz) ? content.quiz : [];
        setQuiz(loadedQuiz);
        setQuizStats({ answered: 0, correct: 0 });
      } else {
        setShareCodeError("Unknown content type: " + type);
        return;
      }

      setLoadedShareInfo({ code, type });
    } catch (err) {
      console.error(err);
      setShareCodeError(err.message || "Failed to load content by code.");
    } finally {
      setShareCodeLoading(false);
    }
  };

  // ================== DOWNLOAD HELPERS ==================
  const downloadTextFile = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAnswer = () => {
    if (!answer.trim()) return;
    const title = selectedDocMeta?.title || "document";
    const text = `Question from: ${title}\n\nQ: ${question}\n\nAnswer:\n${answer}`;
    downloadTextFile("answer.txt", text);
  };

  const handleDownloadSummary = () => {
    if (!summary.trim()) return;
    const title = selectedDocMeta?.title || "document";
    const text = `Summary for: ${title}\nMarks: ${
      summaryMarkTypeUsed || markType
    }\nFocus: ${summaryFocus || "General"}\n\n${summary}`;
    downloadTextFile("summary.txt", text);
  };

  const handleDownloadQuiz = () => {
    if (!quiz || quiz.length === 0) return;
    const payload = {
      quiz,
      stats: quizStats,
    };
    downloadTextFile("quiz.json", JSON.stringify(payload, null, 2));
  };

  // ================== QUICK SUMMARY FOCUS CHIPS ==================
  const summaryFocusChips = [
    "Unit 1",
    "Unit 2",
    "Unit 3",
    "Important Definitions",
    "Formulas Only",
    "Short Notes",
  ];

  return (
    <main
      style={{
        flex: 1,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        background:
          "radial-gradient(circle at top, #0f172a 0, #020617 45%, #020617 100%)",
        color: "#e5e7eb",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow background accents */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.3,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "999px",
            background: "radial-gradient(circle, #38bdf8 0, transparent 60%)",
            top: -60,
            right: -60,
            filter: "blur(12px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "999px",
            background: "radial-gradient(circle, #22c55e 0, transparent 60%)",
            bottom: -70,
            left: -40,
            filter: "blur(16px)",
          }}
        />
      </div>

      {/* Animations for quiz & global */}
      <style>
        {`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }

        @keyframes glowPulse {
          0% { box-shadow: 0 0 0px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 22px rgba(34,197,94,0.9); }
          100% { box-shadow: 0 0 0px rgba(34,197,94,0.2); }
        }

        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .fade-in-up {
          animation: fadeInUp 0.35s ease-out;
        }
        `}
      </style>

      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 900,
              background:
                "linear-gradient(90deg, #38bdf8, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              margin: 0,
            }}
          >
            🧠 Study Workspace
          </h2>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            AI-powered answers, exam-ready summaries, and quizzes — all from
            your own notes.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.4)",
              background: "rgba(15,23,42,0.9)",
              fontSize: 11,
              color: "#cbd5f5",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "999px",
                background: selectedDocId ? "#22c55e" : "#f97316",
              }}
            />
            <span style={{ opacity: 0.9 }}>Selected:</span>
            <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
              {lastDocText}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Signed in as
          </p>
          <p style={{ fontSize: 12, margin: 0 }}>{user?.email}</p>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Shortcuts: 1️⃣ Ask • 2️⃣ Summary • 3️⃣ Quiz • 4️⃣ Docs
          </div>
        </div>
      </header>

      {/* SHARE BAR: Load by Code */}
      <section
        style={{
          ...cardStyle,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
          zIndex: 1,
        }}
        className="fade-in-up"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.36)",
            pointerEvents: "none",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, display: "flex", gap: 6 }}>
              <span>🔗 Load Shared Content</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#bae6fd",
                }}
              >
                Friends • Study Group
              </span>
            </div>
            <div
              style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}
            >
              Paste a 6-digit code shared by another student to instantly
              load their Ask AI answer, Summary, or Quiz.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              maxLength={6}
              value={shareCodeInput}
              onChange={(e) =>
                setShareCodeInput(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="e.g. 483920"
              style={{
                width: 110,
                padding: "7px 10px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.95)",
                color: "#e5e7eb",
                fontSize: 12,
                textAlign: "center",
                letterSpacing: 2,
                outline: "none",
              }}
            />
            <button
              onClick={handleLoadShareCode}
              disabled={shareCodeLoading}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: "none",
                background: shareCodeLoading
                  ? "#4b5563"
                  : "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "#f9fafb",
                fontWeight: 600,
                fontSize: 12,
                cursor: shareCodeLoading ? "default" : "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 0 10px rgba(79,70,229,0.6)",
              }}
            >
              {shareCodeLoading ? "Loading..." : "Load"}
            </button>
          </div>
        </div>

        {(shareCodeError || loadedShareInfo) && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              position: "relative",
              zIndex: 1,
            }}
          >
            {shareCodeError && (
              <div style={{ color: "#f97373" }}>{shareCodeError}</div>
            )}
            {loadedShareInfo && !shareCodeError && (
              <div style={{ color: "#34d399", display: "flex", gap: 6 }}>
                <span>✅ Loaded from code</span>
                <span style={{ fontWeight: 700 }}>
                  {loadedShareInfo.code}
                </span>
                <span>
                  (
                  {loadedShareInfo.type === "ask"
                    ? "Ask AI"
                    : loadedShareInfo.type === "summary"
                    ? "Smart Summary"
                    : loadedShareInfo.type === "quiz"
                    ? "Practice Quiz"
                    : loadedShareInfo.type}
                  )
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* TABS */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ========== QA TAB ========== */}
        {activeTab === "qa" && (
          <section style={{ ...cardStyle }} className="fade-in-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  💬 Ask from Your Notes
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  AI will answer using only the content from your uploaded
                  lecture notes. Perfect for last-minute clarifications.
                </p>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  textAlign: "right",
                }}
              >
                <div>Characters: {question.length}</div>
                <div style={{ color: "#22c55e" }}>
                  Tip: Ask clear and focused questions.
                </div>
              </div>
            </div>

            <textarea
              style={{
                width: "100%",
                minHeight: 120,
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.35)",
                background:
                  "linear-gradient(135deg,rgba(2,6,23,0.9),rgba(15,23,42,0.9))",
                color: "#e5e7eb",
                fontSize: 14,
                resize: "vertical",
                outline: "none",
              }}
              placeholder="E.g., Explain the difference between stack and queue with a real-life example."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                onClick={handleAsk}
                disabled={answerLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: answerLoading
                    ? "#4b5563"
                    : "linear-gradient(135deg,#3b82f6,#2563eb)",
                  color: "#f9fafb",
                  fontWeight: 700,
                  cursor: answerLoading ? "default" : "pointer",
                  fontSize: 14,
                  boxShadow: "0 0 14px rgba(59,130,246,0.8)",
                  minWidth: 130,
                }}
              >
                {answerLoading ? "Thinking..." : "Get Answer"}
              </button>

              {answer && (
                <button
                  onClick={handleDownloadAnswer}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.7)",
                    background: "rgba(15,23,42,0.95)",
                    color: "#e5e7eb",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  ⬇️ Download Answer
                </button>
              )}
            </div>

            {answer && (
              <>
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(2,6,23,0.95)",
                    maxHeight: "45vh",
                    overflowY: "auto",
                  }}
                >
                  <h4 style={{ margin: 0, marginBottom: 8 }}>📌 Answer</h4>
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                    {answer}
                  </div>
                </div>

                {/* CREATE CODE for Ask AI */}
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => handleCreateShareCode("ask")}
                    disabled={shareCreateLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      background: shareCreateLoading
                        ? "#6b7280"
                        : "linear-gradient(135deg,#22c55e,#16a34a)",
                      color: "#020617",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: shareCreateLoading ? "default" : "pointer",
                      boxShadow: "0 0 12px rgba(34,197,94,0.5)",
                    }}
                  >
                    {shareCreateLoading ? "Creating Code..." : "Share as Code"}
                  </button>

                  {shareCreatedCode && shareCreatedType === "ask" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(52,211,153,0.5)",
                        background: "rgba(6,78,59,0.7)",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#bbf7d0" }}>
                        Share this code:
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          letterSpacing: 2,
                          fontSize: 13,
                        }}
                      >
                        {shareCreatedCode}
                      </span>
                      <button
                        onClick={handleCopyShareCode}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: "none",
                          background: "#22c55e",
                          color: "#022c22",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  )}

                  {shareCreateError && (
                    <span style={{ color: "#f97373" }}>
                      {shareCreateError}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* ========== SUMMARY TAB ========== */}
        {activeTab === "summary" && (
          <section style={{ ...cardStyle }} className="fade-in-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    marginTop: 0,
                    marginBottom: 6,
                  }}
                >
                  📘 Smart Summary
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginBottom: 8,
                  }}
                >
                  Get exam-ready answers shaped for <b>2 / 5 / 15 marks</b>.
                  Optionally focus on a specific unit, topic, or formula set.
                </p>
              </div>
              {summary && (
                <button
                  onClick={handleDownloadSummary}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.7)",
                    background: "rgba(15,23,42,0.95)",
                    color: "#e5e7eb",
                    fontSize: 11,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⬇️ Download Answer
                </button>
              )}
            </div>

            <input
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(2,6,23,0.8)",
                color: "#e5e7eb",
                fontSize: 13,
                outline: "none",
              }}
              placeholder="Focus area (optional) — e.g., Unit 2, Formulas, Derivations"
              value={summaryFocus}
              onChange={(e) => setSummaryFocus(e.target.value)}
            />

            {/* QUICK FOCUS CHIPS */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 6,
              }}
            >
              {summaryFocusChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setSummaryFocus(chip)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.5)",
                    background: "rgba(15,23,42,0.9)",
                    color: "#cbd5f5",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* MARK TYPE SELECTOR */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 12,
                marginBottom: 10,
              }}
            >
              {["2", "5", "15"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMarkType(m)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border:
                      markType === m
                        ? "2px solid #38bdf8"
                        : "1px solid rgba(148,163,184,0.5)",
                    background:
                      markType === m
                        ? "linear-gradient(135deg,#38bdf8,#0ea5e9)"
                        : "rgba(15,23,42,0.85)",
                    color: markType === m ? "#0f172a" : "#e2e8f0",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {m} Mark
                </button>
              ))}
            </div>

            <button
              onClick={handleSummarize}
              disabled={summaryLoading}
              style={{
                marginTop: 4,
                padding: "9px 18px",
                borderRadius: 999,
                border: "none",
                background: summaryLoading
                  ? "#4b5563"
                  : "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "#020617",
                fontWeight: 700,
                cursor: summaryLoading ? "default" : "pointer",
                fontSize: 13,
                boxShadow: "0 0 12px rgba(34,197,94,0.5)",
                minWidth: 150,
              }}
            >
              {summaryLoading ? "Generating Answer..." : "Generate Answer"}
            </button>

            {summary && (
              <>
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(2,6,23,0.96)",
                    maxHeight: "50vh",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <h4 style={{ margin: 0 }}>📚 Exam Answer</h4>
                    {summaryMarkTypeUsed && (
                      <div
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: "1px solid rgba(56,189,248,0.7)",
                          background: "rgba(15,23,42,0.9)",
                          color: "#bae6fd",
                          fontWeight: 700,
                        }}
                      >
                        🏅 {summaryMarkTypeUsed} Mark Answer
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                    {summary}
                  </div>
                </div>

                {/* CREATE CODE for Summary */}
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => handleCreateShareCode("summary")}
                    disabled={shareCreateLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      background: shareCreateLoading
                        ? "#6b7280"
                        : "linear-gradient(135deg,#38bdf8,#0ea5e9)",
                      color: "#020617",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: shareCreateLoading ? "default" : "pointer",
                      boxShadow: "0 0 12px rgba(56,189,248,0.5)",
                    }}
                  >
                    {shareCreateLoading ? "Creating Code..." : "Share as Code"}
                  </button>

                  {shareCreatedCode && shareCreatedType === "summary" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(56,189,248,0.5)",
                        background: "rgba(8,47,73,0.8)",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#e0f2fe" }}>
                        Share this code:
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          letterSpacing: 2,
                          fontSize: 13,
                        }}
                      >
                        {shareCreatedCode}
                      </span>
                      <button
                        onClick={handleCopyShareCode}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: "none",
                          background: "#38bdf8",
                          color: "#082f49",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  )}

                  {shareCreateError && (
                    <span style={{ color: "#f97373" }}>
                      {shareCreateError}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* ========== QUIZ TAB ========== */}
        {activeTab === "quiz" && (
          <section style={{ ...cardStyle }} className="fade-in-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                gap: 12,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    marginTop: 0,
                    marginBottom: 4,
                  }}
                >
                  📝 Practice Quiz
                </h3>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  Questions are generated directly from your selected notes.
                  Tap to test and instantly see which options are right.
                </p>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  color: "#9ca3af",
                  minWidth: 140,
                }}
              >
                <div>
                  Score:{" "}
                  <span style={{ color: "#22c55e" }}>
                    {quizStats.correct} / {quizStats.answered}
                  </span>
                </div>
                <div>
                  Accuracy:{" "}
                  <span style={{ color: "#facc15" }}>
                    {quizAccuracy}%
                  </span>
                </div>
                <div>
                  Total Questions:{" "}
                  <span style={{ color: "#38bdf8" }}>{quiz.length}</span>
                </div>
                {quiz.length > 0 && quizStats.answered === quiz.length && (
                  <div style={{ marginTop: 4, color: "#fbbf24" }}>
                    Quiz completed ✅
                  </div>
                )}
              </div>
            </div>

            {/* QUIZ PROGRESS BAR */}
            {quiz.length > 0 && (
              <div
                style={{
                  width: "100%",
                  height: 6,
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.9)",
                  overflow: "hidden",
                  marginBottom: 10,
                  border: "1px solid rgba(148,163,184,0.5)",
                }}
              >
                <div
                  style={{
                    width:
                      quiz.length === 0
                        ? "0%"
                        : `${
                            (quizStats.answered / quiz.length) * 100
                          }%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg,#22c55e,#facc15,#f97316)",
                    transition: "width 0.25s ease-out",
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 13 }}>Number of questions:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={quizCount}
                onChange={(e) => setQuizCount(e.target.value)}
                style={{
                  width: 70,
                  padding: 7,
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(2,6,23,0.8)",
                  color: "#e5e7eb",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={handleQuiz}
                disabled={quizLoading}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: quizLoading
                    ? "#6b7280"
                    : "linear-gradient(135deg,#f97316,#fb923c)",
                  color: "#020617",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: quizLoading ? "default" : "pointer",
                  boxShadow: "0 0 12px rgba(249,115,22,0.5)",
                }}
              >
                {quizLoading ? "Generating..." : "Generate Quiz"}
              </button>

              {quiz.length > 0 && (
                <>
                  <button
                    onClick={handleResetQuiz}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.4)",
                      background: "rgba(15,23,42,0.9)",
                      color: "#e5e7eb",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleDownloadQuiz}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.4)",
                      background: "rgba(15,23,42,0.95)",
                      color: "#e5e7eb",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    ⬇️ Export Quiz JSON
                  </button>
                </>
              )}
            </div>

            {quiz.length > 0 && (
              <>
                <div
                  style={{
                    marginTop: 12,
                    maxHeight: "55vh",
                    overflowY: "auto",
                  }}
                >
                  {quiz.map((q, idx) => (
                    <QuizItem
                      key={idx}
                      q={q}
                      index={idx}
                      onAnswered={handleQuizAnswered}
                    />
                  ))}
                </div>

                {/* CREATE CODE for Quiz */}
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => handleCreateShareCode("quiz")}
                    disabled={shareCreateLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      background: shareCreateLoading
                        ? "#6b7280"
                        : "linear-gradient(135deg,#facc15,#f97316)",
                      color: "#111827",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: shareCreateLoading ? "default" : "pointer",
                      boxShadow: "0 0 12px rgba(250,204,21,0.5)",
                    }}
                  >
                    {shareCreateLoading ? "Creating Code..." : "Share as Code"}
                  </button>

                  {shareCreatedCode && shareCreatedType === "quiz" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(251,191,36,0.6)",
                        background: "rgba(66,32,6,0.9)",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#fef9c3" }}>
                        Share this code:
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          letterSpacing: 2,
                          fontSize: 13,
                        }}
                      >
                        {shareCreatedCode}
                      </span>
                      <button
                        onClick={handleCopyShareCode}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: "none",
                          background: "#facc15",
                          color: "#451a03",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  )}

                  {shareCreateError && (
                    <span style={{ color: "#f97373" }}>
                      {shareCreateError}
                    </span>
                  )}
                </div>
              </>
            )}

            {quiz.length === 0 && !quizLoading && (
              <p
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                No quiz loaded yet. Choose the number of questions and
                click{" "}
                <span style={{ color: "#f97316" }}>Generate Quiz</span> to
                start practicing.
              </p>
            )}
          </section>
        )}

        {/* ========== DOCS TAB ========== */}
        {activeTab === "docs" && <DocumentInfo />}
      </div>
    </main>
  );
}

export default Workspace;

/* ===========================
   QUIZ ITEM COMPONENT
=========================== */

function QuizItem({ q, index, onAnswered }) {
  const [selected, setSelected] = useState(null);

  const isCorrect = (opt) =>
    normalizeLetter(opt) === normalizeLetter(q.answer);

  const handleClick = (opt) => {
    if (selected) return; // lock after first attempt
    setSelected(opt);
    const correct = isCorrect(opt);
    if (typeof onAnswered === "function") onAnswered(correct);
  };

  const getOptionStyle = (opt) => {
    const base = {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(148,163,184,0.3)",
      background: "rgba(15,23,42,0.9)",
      color: "#e2e7f0",
      fontSize: 14,
      cursor: selected ? "default" : "pointer",
      marginBottom: 8,
      textAlign: "left",
      transition: "0.18s",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    };

    if (!selected) {
      return {
        ...base,
        hover: {
          borderColor: "rgba(148,163,184,0.7)",
        },
      };
    }

    const correctOpt = isCorrect(opt);

    if (correctOpt) {
      return {
        ...base,
        background: "#16a34a",
        borderColor: "#16a34a",
        color: "#020617",
        fontWeight: 700,
        animation: "glowPulse 1.1s ease-out",
      };
    }

    if (opt === selected && !correctOpt) {
      return {
        ...base,
        background: "#dc2626",
        borderColor: "#dc2626",
        color: "#f9fafb",
        animation: "shake 0.3s",
      };
    }

    return base;
  };

  const optionLabel = (i) => String.fromCharCode(65 + i); // A, B, C, ...

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.35)",
        background: "rgba(2,6,23,0.96)",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span>
          Q{index + 1}. {q.question}
        </span>
        {selected && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.7)",
              background: "rgba(6,78,59,0.9)",
              color: "#bbf7d0",
            }}
          >
            Answer locked
          </span>
        )}
      </div>

      {q.options &&
        q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleClick(opt)}
            disabled={!!selected}
            style={getOptionStyle(opt)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.8)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {optionLabel(i)}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>{opt}</span>
            </div>
          </button>
        ))}

      {selected && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#93c5fd" }}>
          ✅ Correct answer: <b>{q.answer}</b>
        </div>
      )}

      {selected && q.explanation && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#a5b4fc",
          }}
        >
          ℹ️ {q.explanation}
        </div>
      )}
    </div>
  );
}
