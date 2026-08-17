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

export const WEBHOOK_EVENT_TYPES = [
  "payment.created",
  "payment.pending",
  "payment.confirmed",
  "payment.completed",
  "payment.failed",
  "payment.expired",
  "payment.canceled",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export type WebhookEndpointRecord = {
  id: string;
  object: string;
  url: string;
  environment: string;
  events: string[];
  description: string | null;
  active: boolean;
  secret_last_four: string;
  signing_secret: string | null;
  created_at: string;
  updated_at: string;
  disabled_at: string | null;
};

export type WebhookDeliveryRecord = {
  id: string;
  object: string;
  endpoint_id: string;
  event_id: string;
  status: string;
  attempt_count: number;
  next_attempt_at: string | null;
  last_attempt_at: string | null;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  created_at: string;
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

export async function listWebhookEndpoints(): Promise<
  | { ok: true; endpoints: WebhookEndpointRecord[] }
  | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch("/api/developer/webhook-endpoints");
    const json = await readJson<{ data?: WebhookEndpointRecord[] }>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: errorMessage(json, "Could not list webhook endpoints."),
      };
    }
    return {
      ok: true,
      endpoints: Array.isArray(json.data) ? json.data : [],
    };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function createWebhookEndpoint(input: {
  url: string;
  environment: "test" | "live";
  events: string[];
  description?: string;
}): Promise<
  { ok: true; endpoint: WebhookEndpointRecord } | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch("/api/developer/webhook-endpoints", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const json = await readJson<WebhookEndpointRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not create webhook endpoint."),
      };
    }
    return { ok: true, endpoint: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function updateWebhookEndpoint(
  id: string,
  input: {
    url?: string;
    events?: string[];
    description?: string | null;
    active?: boolean;
  },
): Promise<
  { ok: true; endpoint: WebhookEndpointRecord } | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch(
      `/api/developer/webhook-endpoints/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    );
    const json = await readJson<WebhookEndpointRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not update webhook endpoint."),
      };
    }
    return { ok: true, endpoint: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function rotateWebhookSecret(
  id: string,
): Promise<
  { ok: true; endpoint: WebhookEndpointRecord } | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch(
      `/api/developer/webhook-endpoints/${encodeURIComponent(id)}/rotate-secret`,
      { method: "POST" },
    );
    const json = await readJson<WebhookEndpointRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not rotate webhook secret."),
      };
    }
    return { ok: true, endpoint: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function deleteWebhookEndpoint(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await developerApiFetch(
      `/api/developer/webhook-endpoints/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const json = await readJson<{ id?: string; deleted?: boolean }>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: errorMessage(json, "Could not delete webhook endpoint."),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function listWebhookDeliveries(
  endpointId: string,
): Promise<
  | { ok: true; deliveries: WebhookDeliveryRecord[]; hasMore: boolean }
  | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch(
      `/api/developer/webhook-endpoints/${encodeURIComponent(endpointId)}/deliveries?limit=25`,
    );
    const json = await readJson<{
      data?: WebhookDeliveryRecord[];
      has_more?: boolean;
    }>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: errorMessage(json, "Could not load webhook deliveries."),
      };
    }
    return {
      ok: true,
      deliveries: Array.isArray(json.data) ? json.data : [],
      hasMore: Boolean(json.has_more),
    };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function testWebhookEndpoint(
  id: string,
): Promise<
  | {
      ok: true;
      delivered: boolean;
      responseStatus: number | null;
      responseBody: string | null;
      error: string | null;
    }
  | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch(
      `/api/developer/webhook-endpoints/${encodeURIComponent(id)}/test`,
      { method: "POST" },
    );
    const json = await readJson<{
      delivered?: boolean;
      response_status?: number | null;
      response_body?: string | null;
      error?: string | null;
    }>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: errorMessage(json, "Could not send test webhook."),
      };
    }
    return {
      ok: true,
      delivered: Boolean(json.delivered),
      responseStatus: json.response_status ?? null,
      responseBody: json.response_body ?? null,
      error: typeof json.error === "string" ? json.error : null,
    };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}

export async function retryWebhookDelivery(
  endpointId: string,
  deliveryId: string,
): Promise<
  { ok: true; delivery: WebhookDeliveryRecord } | { ok: false; error: string }
> {
  try {
    const res = await developerApiFetch(
      `/api/developer/webhook-endpoints/${encodeURIComponent(endpointId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
      { method: "POST" },
    );
    const json = await readJson<WebhookDeliveryRecord>(res);
    if (!res.ok || !json.id) {
      return {
        ok: false,
        error: errorMessage(json, "Could not retry delivery."),
      };
    }
    return { ok: true, delivery: json };
  } catch {
    return { ok: false, error: "Could not reach the developer API." };
  }
}
