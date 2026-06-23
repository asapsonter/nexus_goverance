import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth/token";

/**
 * Protects the (console) route group. (Next 16 renamed the "middleware"
 * convention to "proxy"; this is the same request interceptor.)
 *
 * Route groups don't appear in the URL, so we guard the concrete console path
 * prefixes. Everything else — the public portal, /login, the landing page —
 * stays open. Unauthenticated console requests are redirected to /login with a
 * `next` param so we can bounce them back after sign-in.
 */
const CONSOLE_PREFIXES = [
  "/dashboard",
  "/investigations",
  "/complaints",
  "/notices",
  "/remediation",
  "/settlements",
  "/onboarding",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isConsole = CONSOLE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isConsole) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return verifyToken(token ?? "").then((session) => {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/investigations/:path*",
    "/complaints/:path*",
    "/notices/:path*",
    "/remediation/:path*",
    "/settlements/:path*",
    "/onboarding/:path*",
  ],
};
