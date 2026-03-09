import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for multi-tenant site routing.
 *
 * - Preview routes (/preview/*) pass through to the dynamic renderer
 * - API routes (/api/*) pass through to their handlers
 * - Production traffic is rewritten to /api/serve-site to serve static files
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);

  // Ensure the hostname is available to server components / API routes
  headers.set("x-forge-host", request.nextUrl.hostname);

  const { pathname } = request.nextUrl;

  // Let preview and API routes through to their normal handlers
  if (pathname.startsWith("/preview") || pathname.startsWith("/api")) {
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
