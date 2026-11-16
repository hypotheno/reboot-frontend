import { jwtDecode } from "jwt-decode";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export type TokenPayload = { sub?: string | number; email?: string; exp?: number };

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // storage unavailable
  }
}

export function getPayload(): TokenPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  const p = getPayload();
  if (!p) return false;
  return !p.exp || p.exp * 1000 > Date.now();
}