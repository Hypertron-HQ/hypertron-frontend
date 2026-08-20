const PRODUCTION_PAY_ORIGIN = "https://www.hypertron.space";

function isLocalHost(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::1"
    );
  } catch {
    return /localhost|127\.0\.0\.1/.test(value);
  }
}

function payPath(url: string, linkId?: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/pay/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    const match = url.match(/\/pay\/[A-Za-z0-9_-]+/);
    if (match) return match[0];
  }
  const id = linkId?.trim();
  return id ? `/pay/${id}` : null;
}

/**
 * Hosted checkout URL for display and copy.
 * Uses the current dashboard origin in the browser so production never keeps
 * a localhost host from a stale API FRONTEND_URL.
 */
export function toPublicPaymentLinkUrl(url: string, linkId?: string): string {
  const path = payPath(url, linkId);
  if (!path) return url;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }

  if (url && !isLocalHost(url)) {
    try {
      return `${new URL(url).origin}${path}`;
    } catch {
      /* fall through */
    }
  }

  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  const origin = (configured || PRODUCTION_PAY_ORIGIN).replace(/\/$/, "");
  return `${origin}${path}`;
}
