import { API_BASE_URL } from "./config";
import { clearTokens, getAccessToken } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// "fimperial" -> "fimperial@reboot.local" (para tanggapin ng backend na email ang gamit)
export const toEmail = (u: string) => {
  const v = u.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@gmail.com`;
};

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function request<T>(
  path: string,
  { method = "GET", body, auth = true }: Options = {}
): Promise<T> {
  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. It may be waking up, or CORS is blocking it.",
      0
    );
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && auth) clearTokens();
    const m = (data as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(m) ? m.join(", ") : m ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export type Tokens = { accessToken: string; refreshToken?: string };

export async function loginRequest(username: string, password: string): Promise<Tokens> {
  const res = await request<Record<string, unknown> | null>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email: toEmail(username), password },
  });
  const data = res ?? {};
  const accessToken = (data.accessToken ?? data.access_token) as string | undefined;
  const refreshToken = (data.refreshToken ?? data.refresh_token) as string | undefined;
  if (!accessToken) {
    throw new ApiError("Login worked but no token was returned. Check the response shape.", 500);
  }
  return { accessToken, refreshToken };
}

export type RegisterBody = {
  full_name: string;
  email: string;
  password: string;
  weight_kg: number;
  height_cm: number;
};

export function registerRequest(body: RegisterBody) {
  return request<unknown>("/auth/register", {
    method: "POST",
    auth: false,
    body: { ...body, email: toEmail(body.email) },
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};