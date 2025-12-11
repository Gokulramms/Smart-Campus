// src/api/api.js
const API_BASE = "http://127.0.0.1:8000";

async function request(
  path,
  { method = "GET", body, token, isForm = false } = {}
) {
  const headers = {};

  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data.detail || data.message || "API error";
    throw new Error(msg);
  }

  return data;
}

const api = {
  API_BASE,
  get: (path, token) => request(path, { method: "GET", token }),
  post: (path, payload, token) =>
    request(path, { method: "POST", body: payload, token }),
  upload: (path, formData, token) =>
    request(path, { method: "POST", body: formData, token, isForm: true }),

  // ✅ NEW: helpers for sharing feature
  shareCreate: (payload, token) =>
    request("/share/create", { method: "POST", body: payload, token }),

  // /share/get does not require auth, but token won't hurt if passed
  shareGet: (code, token) =>
    request("/share/get", { method: "POST", body: { code }, token }),
};

export default api;
