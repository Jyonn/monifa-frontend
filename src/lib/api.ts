import type { EntryDraft } from "./parse";
import type { MfaEntry, User } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const REFRESH_KEY = "monifa:refresh-token";
let accessToken = "";

type Session = { accessToken: string; refreshToken: string; user: User };

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers }
  });
  if (response.status === 401 && retry && localStorage.getItem(REFRESH_KEY)) {
    await refreshSession();
    return request<T>(path, init, false);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `请求失败 (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function keepSession(session: Session) {
  accessToken = session.accessToken;
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  return session.user;
}

export async function exchangeTicket(ticket: string) {
  return keepSession(await request<Session>("/auth/ticket", { method: "POST", body: JSON.stringify({ ticket }) }));
}

export async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) throw new Error("no_session");
  try {
    return keepSession(await request<Session>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }, false));
  } catch (error) {
    clearSession();
    throw error;
  }
}

export function clearSession() {
  accessToken = "";
  localStorage.removeItem(REFRESH_KEY);
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (refreshToken) await request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }, false).catch(() => undefined);
  clearSession();
}

export function authStartUrl(provider: "qitian" | "github") {
  return `${API_BASE}/auth/${provider}/start`;
}

export async function listEntries(): Promise<{ entries: MfaEntry[]; serverTime: number }> {
  return request("/mfa/entries");
}

export async function createEntry(draft: EntryDraft): Promise<MfaEntry> {
  return request("/mfa/entries", { method: "POST", body: JSON.stringify(draft) });
}

export async function deleteEntry(id: number) {
  return request(`/mfa/entries/${id}`, { method: "DELETE" });
}

export async function unlinkIdentity(provider: string) {
  return request(`/me/identities/${provider}`, { method: "DELETE" });
}

export async function startIdentityLink(provider: "qitian" | "github") {
  const result = await request<{ authorizeUrl: string }>(`/auth/${provider}/link`);
  window.location.href = result.authorizeUrl;
}

export async function deleteAccount() {
  return request("/me/account", { method: "DELETE", body: JSON.stringify({ confirmation: "DELETE" }) });
}
