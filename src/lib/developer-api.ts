/** hypertron-api base URL (no trailing slash). */
export function getDeveloperApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_DEVELOPER_API_URL?.trim();
  if (!raw) return "http://localhost:4001";
  return raw.replace(/\/$/, "");
}

export async function developerApiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${getDeveloperApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
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

export type ApiKeyRecord = {
  id: string;
  object: string;
  name: string;
  environment: string;
  key_prefix: string;
  last_four: string;
  secret_key: string | null;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

type ErrorBody = {
  error?: { message?: string; code?: string } | string;
};

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

function errorMessage(json: ErrorBody, fallback: string): string {
  if (typeof json.error === "string") return json.error;
  if (json.error && typeof json.error === "object" && json.error.message) {
    return json.error.message;
  }
  return fallback;
}

export async function listApiKeys(): Promise<
  { ok: true; keys: ApiKeyRecord[] } | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch("/api/developer/api-keys");
    const json = await readJson<{ data?: ApiKeyRecord[] }>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: errorMessage(json, "Could not list API keys."),
      };
    }
    return { ok: true, keys: Array.isArray(json.data) ? json.data : [] };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function createApiKey(input: {
  name: string;
  environment: "test" | "live";
}): Promise<{ ok: true; key: ApiKeyRecord } | { ok: false; error: string }> {
  try {
    const res = await developerApiFetch("/api/developer/api-keys", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const json = await readJson<ApiKeyRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not create API key."),
      };
    }
    return { ok: true, key: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function rotateApiKey(
  id: string,
): Promise<{ ok: true; key: ApiKeyRecord } | { ok: false; error: string }> {
  try {
    const res = await developerApiFetch(
      `/api/developer/api-keys/${encodeURIComponent(id)}/rotate`,
      { method: "POST" },
    );
    const json = await readJson<ApiKeyRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not rotate API key."),
      };
    }
    return { ok: true, key: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function revokeApiKey(
  id: string,
): Promise<{ ok: true; key: ApiKeyRecord } | { ok: false; error: string }> {
  try {
    const res = await developerApiFetch(
      `/api/developer/api-keys/${encodeURIComponent(id)}/revoke`,
      { method: "POST" },
    );
    const json = await readJson<ApiKeyRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not revoke API key."),
      };
    }
    return { ok: true, key: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}
