// src/utils/storage.js
const TOKEN_KEY = "sca_token";
const USER_KEY = "sca_user";

// Save
export function saveAuthToStorage(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Load
export function loadAuthFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (!token || !userStr) return { token: null, user: null };

    const user = JSON.parse(userStr);
    return { token, user };
  } catch {
    clearAuthFromStorage();
    return { token: null, user: null };
  }
}

// Clear
export function clearAuthFromStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
