const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, { method, body, token }: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const rawMessage = (payload as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : (rawMessage ?? response.statusText);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** For multipart uploads (e.g. inspiration photos) — every other endpoint sends JSON. */
async function uploadFile<T>(path: string, file: File, token?: string | null): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    // No Content-Type here on purpose — the browser sets multipart/form-data
    // with the right boundary itself; setting it manually breaks the upload.
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const rawMessage = (payload as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : (rawMessage ?? response.statusText);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

async function downloadBlob(path: string, token?: string | null): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const rawMessage = (payload as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : (rawMessage ?? response.statusText);
    throw new ApiError(message, response.status);
  }
  return response.blob();
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token }),
  /** For binary responses (e.g. the proposal's PDF) — every other endpoint returns JSON. */
  downloadBlob,
  uploadFile,
};
