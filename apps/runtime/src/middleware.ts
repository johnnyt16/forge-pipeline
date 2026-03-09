import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for multi-tenant site routing.
 *
 * For every incoming request, we pass the hostname as a header
 * so that server components can resolve the correct site.
 *
 * We don't do the DB lookup here (middleware runs on the edge in some
 * environments and can't use Prisma). Instead we pass x-forwarded-host
 * downstream and let server components handle resolution.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);

  // Ensure the hostname is available to server components
  headers.set("x-forge-host", request.nextUrl.hostname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
