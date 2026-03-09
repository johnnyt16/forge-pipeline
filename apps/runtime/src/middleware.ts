import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for multi-tenant site routing.
 *
 * - Preview routes (/preview/*) pass through to the dynamic renderer
 * - API routes (/api/*) pass through to their handlers
 * - Production traffic is rewritten to /api/serve-site to serve static files
 * - On localhost, only preview and API routes work (no hostname-based routing)
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  const hostname = request.nextUrl.hostname;

  // Ensure the hostname is available to server components / API routes
  headers.set("x-forge-host", hostname);

  const { pathname } = request.nextUrl;

  // Let preview and API routes through to their normal handlers
  if (pathname.startsWith("/preview") || pathname.startsWith("/api")) {
    return NextResponse.next({ request: { headers } });
  }

  // On localhost, don't try to serve static sites (no hostname to resolve).
  // Show a simple landing page instead.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return NextResponse.next({ request: { headers } });
  }

  // Rewrite production traffic to serve static files
  const url = request.nextUrl.clone();
  url.pathname = "/api/serve-site";
  url.searchParams.set(
    "path",
    pathname === "/" ? "index.html" : pathname.replace(/^\//, ""),
  );

  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
