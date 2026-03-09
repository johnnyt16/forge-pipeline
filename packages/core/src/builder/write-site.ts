import fs from "fs";
import path from "path";
import { renderStaticSite, type BuildOptions } from "./render-html";
import { prisma } from "../db/client";

/**
 * Resolve the sites output directory.
 * Uses SITES_DIR env var if set, otherwise walks up from cwd to find the
 * monorepo root (package.json with "workspaces") and uses <root>/sites.
 */
export function getSitesDir(): string {
  if (process.env.SITES_DIR) return path.resolve(process.env.SITES_DIR);

  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf8"),
      );
      if (pkg.workspaces) return path.join(dir, "sites");
    } catch {
      // keep walking up
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return path.join(process.cwd(), "sites");
}

export interface WriteSiteOptions extends BuildOptions {
  slug: string;
  config: Record<string, any>;
  sitesDir?: string;
}

/**
 * Build a static site from config and write it to sites/{slug}/.
 * Returns the absolute path to the site directory.
 *
 * If the logo URL points to an uploaded asset (/api/assets/{id}),
 * the binary is fetched from DB and written to assets/logo.{ext},
 * and the config URL is rewritten to the relative path.
 */
export async function writeSite(options: WriteSiteOptions): Promise<string> {
  const { slug, config, sitesDir: overrideDir, ...buildOptions } = options;

  const sitesDir = overrideDir || getSitesDir();
  const siteDir = path.join(sitesDir, slug);
  const assetsDir = path.join(siteDir, "assets");

  // Ensure directories exist
  fs.mkdirSync(assetsDir, { recursive: true });

  // Resolve uploaded asset logos to local files
  const logoUrl = config.branding?.logoUrl as string | undefined;
  const assetMatch = logoUrl?.match(/^\/api\/assets\/(.+)$/);
  if (assetMatch) {
    const assetId = assetMatch[1];
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (asset) {
      const ext = extFromMime(asset.mimeType);
      const localName = `logo.${ext}`;
      fs.writeFileSync(path.join(assetsDir, localName), asset.data);
      config.branding.logoUrl = `assets/${localName}`;
    }
  }

  // Generate the static site
  const output = renderStaticSite(config, buildOptions);

  // Write files
  fs.writeFileSync(path.join(siteDir, "index.html"), output.html, "utf-8");
  fs.writeFileSync(path.join(siteDir, "styles.css"), output.css, "utf-8");
  fs.writeFileSync(path.join(siteDir, "script.js"), output.js, "utf-8");
  fs.writeFileSync(
    path.join(siteDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf-8",
  );

  return siteDir;
}

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  };
  return map[mimeType] || "png";
}
