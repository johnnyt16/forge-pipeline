import { getCurrentSite } from "@/lib/get-site";
import { SiteRenderer } from "@/components/site-renderer";

export const dynamic = "force-dynamic";

/**
 * Main page — resolves the current site from the hostname and renders it.
 * This single route serves ALL client sites.
 */
export default async function SitePage() {
  const result = await getCurrentSite();

  if (!result) {
    return (
      <html lang="en">
        <body style={{ fontFamily: "system-ui, sans-serif", padding: "40px", textAlign: "center" }}>
          <h1>Site Not Found</h1>
          <p style={{ color: "#6b7280" }}>
            No site is configured for this domain.
          </p>
        </body>
      </html>
    );
  }

  return (
    <SiteRenderer
      config={result.config as Record<string, any>}
      siteId={result.site.id}
      isPreview={result.isPreview}
      features={(result.site.features || {}) as Record<string, boolean>}
    />
  );
}
