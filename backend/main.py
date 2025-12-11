import os
import uuid
import logging
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Literal

import json
import faiss
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException,
    Header,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorClient
from google import genai

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# =========================================================
# 🔧 LOAD ENV
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALG = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

if not GEMINI_API_KEY:
  raise RuntimeError("❌ Missing GEMINI_API_KEY in .env")

if not MONGO_URI:
  raise RuntimeError("❌ Missing MONGO_URI in .env")

genai_client = genai.Client(api_key=GEMINI_API_KEY)

# =========================================================
# ⚙️ FASTAPI SETUP
# =========================================================

app = FastAPI(
  title="Smart Campus Assistant",
  description="Smart campus RAG assistant with MongoDB & Auth",
  version="2.1.0",
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smart-campus")

# =========================================================
# 🗄️ MONGO SETUP
# =========================================================

mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client["smart_campus"]
users_collection = db["users"]
docs_collection = db["documents"]
shares_collection = db["shares"]  # for 6-digit share codes

# =========================================================
# 🔐 SECURITY / AUTH HELPERS
# =========================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_PASSWORD_LENGTH = 72  # bcrypt limit


def safe_password(p: str) -> str:
  return p[:MAX_PASSWORD_LENGTH]


def hash_password(password: str) -> str:
  return pwd_context.hash(safe_password(password))


def verify_password(plain: str, hashed: str) -> bool:
  return pwd_context.verify(safe_password(plain), hashed)


def create_access_token(user_id: str) -> str:
  payload = {
    "sub": user_id,
    "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
  }
  return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_user_by_email(email: str) -> Optional[dict]:
  return await users_collection.find_one({"email": email})


async def get_user_by_id(user_id: str) -> Optional[dict]:
  return await users_collection.find_one({"id": user_id})


# =========================================================
# 🔐 AUTH DEPENDENCY
# =========================================================

async def get_current_user(Authorization: str = Header(None)):
  """
  Reads Authorization: Bearer <token>
  and returns the user document.
  """
  if Authorization is None:
    raise HTTPException(status_code=401, detail="Missing Authorization header")

  try:
    scheme, token = Authorization.split()
    if scheme.lower() != "bearer":
      raise ValueError("Invalid scheme")
  except Exception:
    raise HTTPException(status_code=401, detail="Invalid Authorization header format")

  try:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    user_id = payload.get("sub")
    if not user_id:
      raise HTTPException(status_code=401, detail="Invalid token payload")
  except JWTError:
    raise HTTPException(status_code=401, detail="Invalid or expired token")

  user = await get_user_by_id(user_id)
  if not user:
    raise HTTPException(status_code=401, detail="User not found")

  return user


# =========================================================
# 📦 EMBEDDINGS + FAISS
# =========================================================

logger.info("Loading sentence-transformer model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
EMBED_DIM = embedder.get_sentence_embedding_dimension()
logger.info("Embedding model loaded (dim=%d)", EMBED_DIM)

FAISS_INDEXES: Dict[str, faiss.IndexFlatIP] = {}
MAX_CONTEXT_CHARS = 12000


def extract_text_from_pdf(path: str) -> str:
  try:
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
      content = page.extract_text()
      if content:
        text += content + "\n"
    return text
  except Exception as e:
    logger.exception("PDF extraction failed: %s", e)
    raise HTTPException(status_code=400, detail="PDF extraction failed")


def chunk_text(text: str, max_chars: int = 900) -> List[str]:
  text = text.replace("\n", " ")
  words = text.split()
  chunks: List[str] = []
  current = ""

  for w in words:
    if len(current) + len(w) + 1 <= max_chars:
      current += w + " "
    else:
      if current.strip():
        chunks.append(current.strip())
      current = w + " "

  if current.strip():
    chunks.append(current.strip())

  return chunks


def build_faiss_index_for_doc(doc_id: str, chunks: List[str]) -> None:
  embeddings = embedder.encode(chunks, convert_to_numpy=True, normalize_embeddings=True)
  index = faiss.IndexFlatIP(EMBED_DIM)
  index.add(embeddings)
  FAISS_INDEXES[doc_id] = index
  logger.info("FAISS index built for doc %s (%d chunks)", doc_id, len(chunks))


def retrieve_top_chunks(doc_id: str, query: str, chunks: List[str], top_k: int = 5) -> List[str]:
  if doc_id not in FAISS_INDEXES:
    build_faiss_index_for_doc(doc_id, chunks)

  q_emb = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
  index = FAISS_INDEXES[doc_id]
  scores, idxs = index.search(q_emb, top_k)
  idxs = idxs[0]

  result = []
  for i in idxs:
    if 0 <= i < len(chunks):
      result.append(chunks[i])
  return result


def trim_context(context: str, max_chars: int = MAX_CONTEXT_CHARS) -> str:
  if len(context) <= max_chars:
    return context
  return context[-max_chars:]


def call_gemini(system_prompt: str, user_prompt: str) -> str:
  full = f"{system_prompt}\n\n{user_prompt}"
  try:
    resp = genai_client.models.generate_content(
      model="gemini-2.5-flash",
      contents=full,
    )
    return (resp.text or "").strip()
  except Exception as e:
    logger.exception("Gemini API error: %s", e)
    raise HTTPException(status_code=500, detail="Gemini API error")


# =========================================================
# 🧱 Pydantic MODELS
# =========================================================

class UserBase(BaseModel):
  email: EmailStr
  name: Optional[str] = None


class UserCreate(UserBase):
  password: str


class UserLogin(BaseModel):
  email: EmailStr
  password: str


class UserPublic(UserBase):
  id: str
  provider: str


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user: UserPublic


class AskRequest(BaseModel):
  doc_id: str
  question: str


class SummarizeRequest(BaseModel):
  doc_id: str
  focus: Optional[str] = None
  mark_type: Optional[Literal["2", "5", "15"]] = "2"


class QuizRequest(BaseModel):
  doc_id: str
  num_questions: int = 5


class GoogleLoginRequest(BaseModel):
  credential: str


class ShareCreateRequest(BaseModel):
  type: Literal["ask", "summary", "quiz"]
  content: dict


class ShareGetRequest(BaseModel):
  code: str


# =========================================================
# 🌐 AUTH ROUTES
# =========================================================

@app.post("/auth/google", response_model=TokenResponse)
async def google_login(payload: GoogleLoginRequest):
  """
  1. Verify Google ID Token
  2. If new user → create automatically
  3. Return JWT + user info
  """
  try:
    idinfo = id_token.verify_oauth2_token(
      payload.credential,
      google_requests.Request(),
      None,  # no client_id required in backend
    )

    email = idinfo.get("email")
    name = idinfo.get("name", email.split("@")[0] if email else "User")

    if not email:
      raise HTTPException(status_code=400, detail="Google token missing email")

    user = await users_collection.find_one({"email": email})

    if not user:
      new_user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": name,
        "password_hash": None,
        "provider": "google",
        "created_at": datetime.utcnow(),
      }
      await users_collection.insert_one(new_user)
      user = new_user

    token = create_access_token(user["id"])

    return TokenResponse(
      access_token=token,
      user=UserPublic(
        id=user["id"],
        email=user["email"],
        name=user.get("name"),
        provider=user.get("provider", "google"),
      ),
    )

  except Exception as e:
    logger.exception("Google login error: %s", e)
    raise HTTPException(status_code=401, detail="Invalid Google login token")


@app.post("/auth/register", response_model=TokenResponse)
async def register(user_in: UserCreate):
  existing = await get_user_by_email(user_in.email)
  if existing:
    raise HTTPException(status_code=400, detail="Email already registered")

  user_id = str(uuid.uuid4())

  user_doc = {
    "id": user_id,
    "email": user_in.email,
    "name": user_in.name or user_in.email.split("@")[0],
    "password_hash": hash_password(user_in.password),
    "provider": "local",
    "created_at": datetime.utcnow(),
  }

  await users_collection.insert_one(user_doc)

  token = create_access_token(user_id)
  public = UserPublic(
    id=user_id,
    email=user_doc["email"],
    name=user_doc["name"],
    provider=user_doc["provider"],
  )
  return TokenResponse(access_token=token, user=public)


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_in: UserLogin):
  user = await get_user_by_email(user_in.email)
  if not user:
    raise HTTPException(status_code=401, detail="Invalid credentials")

  hashed = user.get("password_hash") or user.get("password")
  if not hashed or not verify_password(user_in.password, hashed):
    raise HTTPException(status_code=401, detail="Invalid credentials")

  token = create_access_token(user["id"])
  public = UserPublic(
    id=user["id"],
    email=user["email"],
    name=user.get("name"),
    provider=user.get("provider", "local"),
  )
  return TokenResponse(access_token=token, user=public)


@app.get("/auth/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)):
  return UserPublic(
    id=current_user["id"],
    email=current_user["email"],
    name=current_user.get("name"),
    provider=current_user.get("provider", "local"),
  )


# =========================================================
# 🌐 CORE ROUTES (DOCS + RAG)
# =========================================================

@app.get("/")
async def health_check():
  return {"status": "ok", "message": "Smart Campus Assistant backend is running 🚀"}


@app.post("/upload")
async def upload_document(
  file: UploadFile = File(...),
  title: str = Form("Untitled"),
  subject: str = Form("General"),
  current_user: dict = Depends(get_current_user),
):
  filename = file.filename or "uploaded.pdf"
  ext = filename.split(".")[-1].lower()
  if ext != "pdf":
    raise HTTPException(status_code=400, detail="Only PDF files are supported")

  doc_id = str(uuid.uuid4())
  save_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
  with open(save_path, "wb") as f:
    f.write(await file.read())

  raw_text = extract_text_from_pdf(save_path)
  if not raw_text.strip():
    raise HTTPException(status_code=400, detail="No readable text found in PDF")

  chunks = chunk_text(raw_text)
  created_at = datetime.utcnow()

  doc_entry = {
    "id": doc_id,
    "user_id": current_user["id"],
    "title": title or filename,
    "subject": subject,
    "raw_text": raw_text,
    "chunks": chunks,
    "created_at": created_at,
  }
  await docs_collection.insert_one(doc_entry)

  build_faiss_index_for_doc(doc_id, chunks)

  return {
    "status": "ok",
    "doc_id": doc_id,
    "title": doc_entry["title"],
    "subject": doc_entry["subject"],
    "num_chunks": len(chunks),
    "created_at": created_at.isoformat(),
  }


@app.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)):
  cursor = docs_collection.find({"user_id": current_user["id"]}).sort("created_at", -1)
  docs = []
  async for d in cursor:
    docs.append(
      {
        "id": d["id"],
        "title": d["title"],
        "subject": d["subject"],
        "num_chunks": len(d.get("chunks", [])),
        "created_at": d["created_at"].isoformat(),
      }
    )
  return {"documents": docs}


async def get_doc_for_user(doc_id: str, user_id: str) -> dict:
  doc = await docs_collection.find_one({"id": doc_id, "user_id": user_id})
  if not doc:
    raise HTTPException(status_code=404, detail="Document not found")
  return doc


@app.post("/ask")
async def ask_question(req: AskRequest, current_user: dict = Depends(get_current_user)):
  doc = await get_doc_for_user(req.doc_id, current_user["id"])
  chunks = doc.get("chunks", [])
  if not chunks:
    raise HTTPException(status_code=400, detail="Document has no chunks")

  top_chunks = retrieve_top_chunks(req.doc_id, req.question, chunks, top_k=5)
  context = trim_context("\n\n".join(top_chunks))

  system_prompt = (
    "You are a Smart Campus AI tutor.\n"
    "Use ONLY the given CONTEXT from the student's notes to answer.\n"
    "If the answer is not present, reply exactly with: 'Not enough information in the notes.'\n"
    "Explain in simple, exam-focused points."
  )

  user_prompt = f"CONTEXT:\n{context}\n\nQUESTION:\n{req.question}"
  answer = call_gemini(system_prompt, user_prompt)

  return {"status": "ok", "answer": answer, "used_chunks": top_chunks}


@app.post("/summarize")
async def summarize_document(
  req: SummarizeRequest, current_user: dict = Depends(get_current_user)
):
  doc = await get_doc_for_user(req.doc_id, current_user["id"])
  chunks = doc.get("chunks", [])
  if not chunks:
    raise HTTPException(status_code=400, detail="Document has no chunks")

  selected_chunks = chunks[:15]
  context = trim_context("\n\n".join(selected_chunks))

  mark_type = req.mark_type or "2"
  focus_text = req.focus or "overall important topics for exam"

  # Tailor instructions by mark type
  if mark_type == "2":
    length_instructions = (
      "Write a short 2-mark answer, about 4–5 lines maximum. "
      "Be direct, crisp, and point-wise if possible."
    )
  elif mark_type == "5":
    length_instructions = (
      "Write a detailed 5-mark answer, around 8–10 lines. "
      "Cover definition, key explanation, and 2–3 important points."
    )
  else:  # "15"
    length_instructions = (
      "Write a full, high-quality 15-mark answer (more than 20 lines). "
      "Include introduction, clear headings, bullet points, explanation of concepts, "
      "examples if relevant, and a small conclusion. The answer should be strong enough "
      "to score full marks in a university exam."
    )

  system_prompt = (
    "You are an AI that writes exam answers based only on the provided lecture notes.\n"
    "Use only the CONTEXT. Do not invent facts that are not supported by the notes."
  )

  user_prompt = f"""
CONTEXT (LECTURE NOTES):
{context}

TASK:
Student wants an exam-ready answer.

Question focus: {focus_text}
Mark type: {mark_type} marks

Instructions:
- {length_instructions}
- Use clear, student-friendly language.
- Prefer headings and bullet points where helpful.
- Do NOT mention that you are an AI or that this is a summary.
"""

  summary_text = call_gemini(system_prompt, user_prompt)

  return {
    "status": "ok",
    "summary": summary_text,
    "mark_type": mark_type,
  }


@app.post("/quiz")
async def generate_quiz(req: QuizRequest, current_user: dict = Depends(get_current_user)):
  doc = await get_doc_for_user(req.doc_id, current_user["id"])
  chunks = doc.get("chunks", [])

  if not chunks:
    raise HTTPException(status_code=400, detail="Document has no chunks")

  if not (1 <= req.num_questions <= 20):
    raise HTTPException(status_code=400, detail="num_questions must be between 1 and 20")

  context = trim_context("\n\n".join(chunks[:12]))

  system_prompt = (
    "You are an AI that creates MCQ questions ONLY in valid JSON.\n"
    "ABSOLUTELY NO markdown, no ``` fences, no commentary.\n"
    "Output ONLY a pure JSON array."
  )

  user_prompt = f"""
CONTEXT:
{context}

TASK:
Generate exactly {req.num_questions} MCQs.

Return ONLY a JSON array like:
[
  {{
    "question": "...",
    "options": ["A) ...","B) ...","C) ...","D) ..."],
    "answer": "A",
    "explanation": "short reason"
  }}
]
"""

  raw_response = call_gemini(system_prompt, user_prompt)

  if isinstance(raw_response, dict):
    raw = json.dumps(raw_response)
  else:
    raw = str(raw_response)

  raw = raw.strip()
  if raw.startswith("```"):
    raw = raw.replace("```json", "").replace("```", "").strip()

  try:
    quiz_json = json.loads(raw)
  except Exception:
    logger.error("❌ QUIZ JSON ERROR — RAW OUTPUT:\n%s", raw)
    raise HTTPException(status_code=500, detail="AI returned invalid JSON")

  if not isinstance(quiz_json, list):
    logger.error("❌ QUIZ JSON ERROR — NOT ARRAY:\n%s", raw)
    raise HTTPException(status_code=500, detail="Invalid JSON format — expected list")

  return {"status": "ok", "quiz": quiz_json}


# =========================================================
# 🔗 SHARE CODE ROUTES
# =========================================================

async def generate_unique_code() -> str:
  """Generate a unique 6-digit numeric code."""
  for _ in range(20):
    code = f"{random.randint(0, 999999):06d}"
    existing = await shares_collection.find_one({"code": code})
    if not existing:
      return code
  raise HTTPException(status_code=500, detail="Could not generate unique code")


@app.post("/share/create")
async def share_create(
  req: ShareCreateRequest,
  current_user: dict = Depends(get_current_user),
):
  """
  Create a 6-digit share code for:
  - Ask AI answer
  - Summary
  - Quiz
  """
  if req.type not in {"ask", "summary", "quiz"}:
    raise HTTPException(status_code=400, detail="Invalid share type")

  code = await generate_unique_code()
  now = datetime.utcnow()

  share_doc = {
    "code": code,
    "type": req.type,
    "content": req.content,
    "owner_user_id": current_user["id"],
    "created_at": now,
  }

  await shares_collection.insert_one(share_doc)

  return {
    "status": "ok",
    "code": code,
    "type": req.type,
    "created_at": now.isoformat(),
  }


@app.post("/share/get")
async def share_get(
  req: ShareGetRequest,
  current_user: dict = Depends(get_current_user),
):
  """
  Resolve a 6-digit code back to its content.
  (Currently does not restrict by owner — anyone logged in can use the code.)
  """
  code = (req.code or "").strip()
  if len(code) != 6:
    raise HTTPException(status_code=400, detail="Invalid code format")

  doc = await shares_collection.find_one({"code": code})
  if not doc:
    raise HTTPException(status_code=404, detail="Code not found")

  return {
    "status": "ok",
    "code": doc["code"],
    "type": doc["type"],
    "content": doc["content"],
  }
