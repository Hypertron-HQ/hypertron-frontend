const REQUEST_HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/** Dropped from the upstream response so Vercel/Next can send a real body. */
const RESPONSE_HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
]);

export async function proxyToAwsBackend(
  request: Request,
  upstreamOrigin: string,
  pathSegments: string[],
): Promise<Response> {
  const incoming = new URL(request.url);
  const dest = `${upstreamOrigin.replace(/\/$/, "")}/${pathSegments.join("/")}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!REQUEST_HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" || method === "OPTIONS"
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(dest, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  // Buffer the body. Forwarding `upstream.body` as a stream on Vercel Node
  // often yields HTTP 200 with an empty body (signup challenge, health, etc.)
  // while 4xx JSON still appears. ETag is copied from a full origin response.
  const payload = await upstream.arrayBuffer();

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (RESPONSE_HOP_BY_HOP.has(k) || k === "set-cookie") return;
    out.append(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    out.append("set-cookie", cookie);
  }

  return new Response(payload, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
