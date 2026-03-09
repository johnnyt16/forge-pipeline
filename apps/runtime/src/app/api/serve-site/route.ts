import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHostname, getSitesDir } from "@forge/core";
import fs from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/**
 * GET /api/serve-site — Serve static files for production sites.
 * The middleware rewrites production traffic here with ?path=<filename>.
 */
export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("x-forge-host") || "";
    let filePath = req.nextUrl.searchParams.get("path") || "index.html";
    if (filePath === "" || filePath === "/") filePath = "index.html";

    // Resolve hostname to site
    const result = await resolveSiteFromHostname(host);
    if (!result) {
      return new NextResponse(
        "<html><body style=\"font-family:system-ui;padding:40px;text-align:center\"><h1>Site Not Found</h1><p>No site is configured for this domain.</p></body></html>",
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const slug = result.site.slug;
    const sitesDir = getSitesDir();

    // Path traversal protection
    const siteRoot = path.resolve(sitesDir, slug);
    const resolved = path.resolve(siteRoot, filePath);
    if (!resolved.startsWith(siteRoot + path.sep) && resolved !== siteRoot) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      if (filePath === "index.html") {
        return new NextResponse(
          "<html><body style=\"font-family:system-ui;padding:40px;text-align:center\"><h1>Site Not Ready</h1><p>This site has not been exported yet. Run the pipeline and export files.</p></body></html>",
          { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }
      return new NextResponse("Not found", { status: 404 });
    }

    // Read and serve
    const content = fs.readFileSync(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Serve site error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
