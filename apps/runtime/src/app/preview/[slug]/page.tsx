import { getSiteBySlug } from "@/lib/get-site";
import { SiteRenderer } from "@/components/site-renderer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Preview route — renders a site by slug without requiring custom domain setup.
 * Used by the admin app to preview generated sites.
 *
 * URL: /preview/{site-slug}
 */
export default async function PreviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getSiteBySlug(params.slug);

  if (!result) {
    notFound();
  }

  return (
    <SiteRenderer
      config={result.config as Record<string, any>}
      siteId={result.site.id}
      isPreview={true}
      features={(result.site.features || {}) as Record<string, boolean>}
    />
  );
}
