const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const SESSION_KEY = "foodworld-api-session";

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
export function saveSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

export async function apiRequest(path, { method = "GET", body, token = getSession()?.accessToken, headers = {} } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.errors?.[0]?.message || payload.message || "The server could not complete this request.");
  return payload.data;
}

export async function signIn(email, password) { const session = await apiRequest("/auth/login", { method: "POST", body: { email, password }, token: null }); saveSession(session); return session; }
export async function signUp({ name, email, password, phone }) { const session = await apiRequest("/auth/register", { method: "POST", body: { name, email, password, phone }, token: null }); saveSession(session); return session; }
export async function signOut() { try { if (getSession()?.accessToken) await apiRequest("/auth/logout", { method: "POST" }); } finally { clearSession(); } }
export async function fetchCurrentUser() { const data = await apiRequest("/users/me"); const session = getSession(); if (session) saveSession({ ...session, user: data.user }); return data.user; }
export { API_BASE_URL };
