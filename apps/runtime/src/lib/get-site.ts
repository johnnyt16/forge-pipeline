import { headers } from "next/headers";
import { prisma, resolveSiteFromHostname } from "@forge/core";

/**
 * Resolve the current site from the request hostname.
 * Used by server components to load the right config.
 *
 * Falls back to slug-based query param for local development:
 *   http://localhost:3001?site=acme-insurance
 */
export async function getCurrentSite() {
  const headersList = headers();
  const host = headersList.get("x-forge-host") || headersList.get("host") || "";

  // Try hostname-based resolution first
  const result = await resolveSiteFromHostname(host);
  if (result) return result;

  // In development, allow ?site=slug query param for easy testing
  // This is read from x-forge-site header set by middleware, or from referer
  return null;
}

/**
 * Get a site directly by slug — used for preview routes and dev.
 */
export async function getSiteBySlug(slug: string) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return null;

  const config = (site.previewConfig || site.liveConfig) as Record<string, unknown> | null;
  if (!config) return null;

  return { site, config, isPreview: !site.liveConfig };
}
