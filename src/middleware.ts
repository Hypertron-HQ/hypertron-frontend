import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasAppSession } from "@/lib/app-session";
import { homeLaunchPath } from "@/lib/launch-auth";
import { isProtectedAppPath } from "@/lib/protected-routes";

/**
 * Dashboard and RegIntel require Privy or wallet session.
 * Unauthenticated users are sent to home Launch dialog (?launch=1), not /auth/sign-in.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  if (await hasAppSession(req)) {
    return NextResponse.next();
  }

  const returnPath = pathname + req.nextUrl.search;
  const launch = homeLaunchPath(returnPath);
  const u = new URL(launch, req.url);
  if (!process.env.AUTH_SECRET?.trim()) {
    u.searchParams.set("reason", "config");
  }
  return NextResponse.redirect(u);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
