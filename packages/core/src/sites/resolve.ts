import { prisma } from "../db/client";
import type { Site } from "@prisma/client";

/**
 * Resolve a Site from the incoming request hostname.
 *
 * Resolution order:
 * 1. Custom domain lookup (e.g. "www.acmeinsurance.com")
 * 2. Preview slug lookup (e.g. "acme-insurance.preview.yourdomain.com" → slug "acme-insurance")
 * 3. Direct slug in subdomain (e.g. "acme-insurance.sites-runtime.railway.app")
 *
 * Returns the Site with its config, or null if no match.
 */
export async function resolveSiteFromHostname(hostname: string): Promise<{
  site: Site;
  config: Record<string, unknown>;
  isPreview: boolean;
} | null> {
  // Strip port if present (localhost:3001 → localhost)
  const host = hostname.split(":")[0];

  // 1. Try custom domain lookup
  const domain = await prisma.domain.findUnique({
    where: { hostname: host },
    include: { site: true },
  });

  if (domain?.site) {
    const config = domain.site.liveConfig as Record<string, unknown> | null;
    if (config && domain.site.status === "LIVE") {
      return { site: domain.site, config, isPreview: false };
    }
  }

  // 2. Extract slug from subdomain pattern
  // Patterns: "{slug}.preview.domain.com" or "{slug}.domain.com"
  const slug = extractSlugFromHost(host);

  if (slug) {
    const site = await prisma.site.findUnique({ where: { slug } });

    if (site) {
      // Determine if this is a preview request
      const isPreview = host.includes(".preview.") || host.includes("preview-");

      if (isPreview) {
        const config = site.previewConfig as Record<string, unknown> | null;
        if (config) {
          return { site, config, isPreview: true };
        }
      } else {
        // Production — use liveConfig if available, fall back to previewConfig
        const config = (site.liveConfig || site.previewConfig) as Record<string, unknown> | null;
        if (config && (site.status === "LIVE" || site.status === "PREVIEW")) {
          return { site, config, isPreview: false };
        }
      }
    }
  }

  return null;
}

/**
 * Extract the site slug from a hostname.
 * Handles: "my-site.anything.com" → "my-site"
 *          "preview-my-site.anything.com" → "my-site"
 */
function extractSlugFromHost(host: string): string | null {
  const parts = host.split(".");
  if (parts.length < 2) return null;

  let subdomain = parts[0];

  // Handle "preview-{slug}" pattern
  if (subdomain.startsWith("preview-")) {
    subdomain = subdomain.slice(8);
  }

  // Ignore common non-slug subdomains
  if (["www", "admin", "api", "mail"].includes(subdomain)) return null;

  return subdomain || null;
}

/**
 * Get a site's feature flags as a typed object.
 */
export function getSiteFeatures(site: Site): SiteFeatures {
  const defaults: SiteFeatures = {
    contactForm: false,
    quoteRequest: false,
    leadCapture: false,
  };

  const stored = (site.features || {}) as Partial<SiteFeatures>;
  return { ...defaults, ...stored };
}

export interface SiteFeatures {
  contactForm: boolean;
  quoteRequest: boolean;
  leadCapture: boolean;
  [key: string]: boolean;
}
