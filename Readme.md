# 📚 Smart Campus Assistant
A modern, full‑stack, AI‑powered study companion that transforms your personal notes into:
- **AI‑generated answers** from uploaded documents
- **Exam‑ready summaries** (2‑, 5‑, and 15‑mark formats)
- **Auto‑generated quizzes** with real‑time feedback
- **Sharable content** via unique 6‑digit codes (Ask / Summary / Quiz)
- **Secure and personalized workspace** with login, Google OAuth, and document management

This project is designed for students who want a fast, private, and intelligent assistant that learns from *their own study material*.

---

# 🚀 Features

### ✅ AI‑Powered Learning (RAG-based)
- Ask any question from your uploaded notes
- Answers generated using retrieval‑augmented generation (RAG)
- Context‑aware response based on exact document segments

### 📝 Smart Summaries
- Generate **2‑mark**, **5‑mark**, or **15‑mark** exam answers
- Optional focus (Unit‑wise, Formulas, Definitions, etc.)
- Downloadable summaries

### 🎯 Quiz Generator
- Create dynamic multiple‑choice quizzes from your notes
- Real‑time correctness feedback
- Score, accuracy, progress tracking
- Export quiz as JSON

### 🔗 Smart Sharing System
Generate and share:
- Ask AI responses
- Summaries
- Quizzes

Students can load shared content using a **6‑digit code**—perfect for group study.

### 📂 Document Management
- Upload PDFs
- Automatic text extraction and chunking
- Per‑user indexing
- Fast search using embeddings

### 🔐 Authentication
- JWT-based Login/Registration
- Google OAuth
- Auto‑login via secure local storage

### 🎨 Modern UI/UX
- Neo-glassmorphism design
- Animations (shake, glow, fade‑in)
- Completely responsive components
- Keyboard shortcuts (1=Ask, 2=Summary, 3=Quiz, 4=Docs)

---

# 🏗️ Project Architecture

## **🌐 High-Level Architecture Overview**

```text
 ┌──────────────────────────┐        ┌──────────────────────────────┐
 │        Frontend          │        │            Backend            │
 │      (React + JS)        │        │        (FastAPI + RAG)        │
 └───────────┬──────────────┘        └──────────────┬───────────────┘
             │ HTTP/JSON API Calls                     │
             │ (Auth, Upload, Ask, Summary, Quiz)      │
             ▼                                          ▼
     ┌───────────────────┐                     ┌────────────────────────┐
     │  api.js Layer     │                     │ Authentication Service │
     │  (fetch wrapper)  │                     │  (JWT, Google OAuth)   │
     └───────────────────┘                     └──────────┬─────────────┘
             │                                             │
             ▼                                             ▼
     ┌───────────────────┐                     ┌────────────────────────┐
     │ Auth Context       │                     │ Document Processor     │
     │ LocalStorage sync  │                     │ (PDF → Text → Chunks)  │
     └───────────────────┘                     └──────────┬─────────────┘
             │                                             │
             ▼                                             ▼
     ┌───────────────────┐                     ┌────────────────────────┐
     │ React Components  │                     │ Embedding Generator    │
     │ (Upload, Ask, UI) │                     │ (Sentence Transformers)│
     └───────────────────┘                     └──────────┬─────────────┘
             │                                             │
             ▼                                             ▼
     ┌───────────────────┐                     ┌────────────────────────┐
     │ Workspace Tabs    │                     │ Vector DB (FAISS)      │
     │ Ask · Summary ·   │                     │ Per‑user, per‑document │
     │ Quiz · Info       │                     └──────────┬─────────────┘
     └───────────────────┘                                │
             │                                             ▼
             ▼                                   ┌────────────────────────┐
     ┌───────────────────┐                      │ LLM (Google Gemini API)│
     │ Display Answers   │                      └────────────────────────┘
     │ Share Codes       │
     └───────────────────┘
```

---

# 📦 Folder Structure

```
smart-campus/
│
├── frontend/
│   ├── src/
│   │   ├── api/            # API wrapper for backend
│   │   ├── auth/           # Login, Register, Google OAuth
│   │   ├── components/     # Sidebar, UploadCard, Tabs, Statistics
│   │   ├── context/        # AuthContext (global state)
│   │   ├── pages/          # Workspace, DocumentInfo
│   │   ├── utils/          # LocalStorage utilities
│   │   ├── App.js          # Root component
│   │   └── index.js        # React entry
│   └── public/
│
├── backend/
│   ├── main.py             # FastAPI entry
│   ├── routes/             # /auth, /upload, /ask, /summary, /quiz
│   ├── services/           # RAG engine, PDF processing
│   ├── database/           # User, document models
│   ├── embeddings/         # HF model loader
│   └── indexes/            # FAISS vector stores
│
└── README.md
```

---

# ⚙️ Tech Stack

## **Frontend**
- React.js
- Pure CSS + inline styles
- Browser Router
- LocalStorage
- Google OAuth

## **Backend**
- **FastAPI**
- **FAISS** (vector indexing)
- **Sentence Transformers** (embeddings)
- **JWT Authentication**
- **Google Generative AI** (LLM)
- PDF/Text extractors (PyPDF2, etc.)

---

# 🔥 Core Workflow

## 1️⃣ User Uploads PDF
```
PDF → text → clean → chunk → embed → store in FAISS
```

## 2️⃣ Ask AI
```
query → embed → similarity search → top chunks → LLM → answer
```

## 3️⃣ Smart Summary
```
focus (optional) + mark type → LLM → structured answer
```

## 4️⃣ Quiz Generator
```
chunks → LLM prompt → MCQs → evaluate
```

## 5️⃣ Sharing System
```
content + type → db entry → 6‑digit code → friend loads it
```

---

# 📥 Installation & Setup

## Clone the repository
```bash
git clone https://github.com/Gokulramms/Smart-Campus.git
cd Smart-Campus
```

## Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables
Create `.env` in backend:
```
GOOGLE_API_KEY=your_key_here
JWT_SECRET=your_secret
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

# 📌 Key Components Summary

### **AuthContext.js**
- Stores user + token
- Auto login via LocalStorage
- Google Login supported

### **Workspace.js**
Contains:
- Ask AI module
- Summary module
- Quiz generator
- Share system
- Downloads

### **Sidebar.js**
- Document list
- Upload card
- Stats
- Logout button

---

# 🛡️ Security
- JWT-secured routes
- Google OAuth integrity
- Local FAISS indexing (not cloud)
- No document leaves user’s system except for embedding + LLM query

---

# 🧪 Roadmap
- [ ] Add dark/light theme toggle
- [ ] Add multi-file merge support
- [ ] Offline inference support
- [ ] Export notes as PDF/Docx
- [ ] Mobile responsive redesign

---

# 🤝 Contributions
Pull requests are welcome!

---

# 📄 License
MIT License

---

# 👨‍💻 Author
**Gokulramms**

Smart, simple, and made for students who want AI power from *their own notes*. 🎓✨

