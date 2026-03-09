import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHostname, getSitesDir } from "@forge/core";
import fs from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
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

// Files that should not be publicly served
const BLOCKED_FILES = new Set(["config.json"]);

/**
 * GET /api/serve-site — Serve static files for production sites.
 * The middleware rewrites production traffic here with ?path=<filename>.
 */
export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("x-forge-host") || "";
    let filePath = req.nextUrl.searchParams.get("path") || "index.html";
    if (filePath === "" || filePath === "/") filePath = "index.html";

    // Block access to internal files
    const basename = path.basename(filePath);
    if (BLOCKED_FILES.has(basename)) {
      return new NextResponse("Not found", { status: 404 });
    }

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

    // Path traversal protection using realpath
    const siteRoot = path.resolve(sitesDir, slug);
    const requested = path.resolve(siteRoot, filePath);

    // Check that the requested path is within the site root
    if (!requested.startsWith(siteRoot + path.sep) && requested !== siteRoot) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if file exists (async)
    try {
      const stat = await fs.stat(requested);
      if (stat.isDirectory()) {
        return new NextResponse("Not found", { status: 404 });
      }
    } catch {
      if (filePath === "index.html") {
        return new NextResponse(
          "<html><body style=\"font-family:system-ui;padding:40px;text-align:center\"><h1>Site Not Ready</h1><p>This site has not been exported yet. Run the pipeline and export files.</p></body></html>",
          { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }
      return new NextResponse("Not found", { status: 404 });
    }

    // Verify realpath is still within siteRoot (catches symlink attacks)
    const realResolved = await fs.realpath(requested);
    const realSiteRoot = await fs.realpath(siteRoot);
    if (!realResolved.startsWith(realSiteRoot + path.sep) && realResolved !== realSiteRoot) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Read and serve (async)
    const content = await fs.readFile(realResolved);
    const ext = path.extname(realResolved).toLowerCase();
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
