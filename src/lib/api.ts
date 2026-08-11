/** Core backend base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "http://localhost:4000";
  return raw.replace(/\/$/, "");
}

/**
 * Fetch against the Hypertron core API.
 * Always sends credentials so HttpOnly session cookies (`ht_dashboard`) are included.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);

  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    credentials: "include",
    headers,
  });
}
