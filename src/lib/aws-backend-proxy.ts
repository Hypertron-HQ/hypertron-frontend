const HOP_BY_HOP = new Set([
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

export async function proxyToAwsBackend(
  request: Request,
  upstreamOrigin: string,
  pathSegments: string[],
): Promise<Response> {
  const incoming = new URL(request.url);
  const dest = `${upstreamOrigin.replace(/\/$/, "")}/${pathSegments.join("/")}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
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

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    out.append(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
