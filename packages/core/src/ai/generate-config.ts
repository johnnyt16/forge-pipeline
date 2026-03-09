import { prisma } from "../db/client";
import { transitionStatus } from "../pipeline/status";
import { ProjectStatus } from "@prisma/client";

/**
 * Default template settings by template family.
 */
const TEMPLATE_DEFAULTS: Record<string, { theme: Record<string, string>; layout: Record<string, boolean> }> = {
  INSURANCE_AGENCY: {
    theme: {
      primaryColor: "#1a56db",
      secondaryColor: "#0e9f6e",
      accentColor: "#ff5a1f",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontHeading: "Inter",
      fontBody: "Inter",
    },
    layout: {
      showHero: true,
      showServices: true,
      showAbout: true,
      showTestimonials: true,
      showFaq: true,
      showContact: true,
      showFooter: true,
    },
  },
  LOCAL_SERVICE: {
    theme: {
      primaryColor: "#059669",
      secondaryColor: "#2563eb",
      accentColor: "#d97706",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontHeading: "Inter",
      fontBody: "Inter",
    },
    layout: {
      showHero: true,
      showServices: true,
      showAbout: true,
      showTestimonials: true,
      showFaq: true,
      showContact: true,
      showFooter: true,
    },
  },
  PROFESSIONAL_SERVICES: {
    theme: {
      primaryColor: "#4f46e5",
      secondaryColor: "#0891b2",
      accentColor: "#e11d48",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontHeading: "Inter",
      fontBody: "Inter",
    },
    layout: {
      showHero: true,
      showServices: true,
      showAbout: true,
      showTestimonials: true,
      showFaq: true,
      showContact: true,
      showFooter: true,
    },
  },
};

/**
 * Generate the final site config by combining extracted data, generated copy,
 * and template defaults into a single JSON structure that drives the template.
 *
 * If the project is linked to a Site, the config is written to Site.previewConfig.
 * Otherwise it's stored only in ProjectData.siteConfigJson.
 */
export async function generateSiteConfig(projectId: string): Promise<void> {
  const [project, projectData] = await Promise.all([
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { site: true },
    }),
    prisma.projectData.findUnique({ where: { projectId } }),
  ]);

  if (!projectData?.extractedJson || !projectData?.generatedCopyJson) {
    throw new Error("Need both extracted data and generated copy to build config.");
  }

  const extracted = projectData.extractedJson as Record<string, unknown>;
  const copy = projectData.generatedCopyJson as Record<string, unknown>;

  // Pick template defaults based on the site's template family (or fall back)
  const templateFamily = project.site?.templateFamily || "INSURANCE_AGENCY";
  const defaults = TEMPLATE_DEFAULTS[templateFamily] || TEMPLATE_DEFAULTS.INSURANCE_AGENCY;

  // Read site features (includes layout overrides if set)
  const siteFeatures = (project.site?.features || {}) as Record<string, unknown>;

  const siteConfig = {
    meta: {
      projectId: project.id,
      siteId: project.siteId || null,
      clientName: project.clientName,
      templateFamily,
      generatedAt: new Date().toISOString(),
    },
    branding: {
      businessName: extracted.businessName || project.clientName,
      logoUrl: extracted.logoUrl || null,
      phone: extracted.phone || "",
      email: extracted.email || project.contactEmail,
      address: extracted.address || "",
      officeHours: extracted.officeHours || "",
      socialLinks: extracted.socialLinks || [],
    },
    theme: defaults.theme,
    // Merge layout defaults with any overrides stored in Site.features.layout
    layout: {
      ...defaults.layout,
      ...(siteFeatures.layout || {}),
    },
    hero: copy.hero || {},
    services: copy.services || {},
    about: copy.about || {},
    testimonials: copy.testimonials || {},
    faq: copy.faq || {},
    contact: copy.contact || {},
    footer: {
      ...(copy.footer as Record<string, unknown> || {}),
      businessName: extracted.businessName || project.clientName,
      phone: extracted.phone || "",
      email: extracted.email || project.contactEmail,
      address: extracted.address || "",
    },
  };

  // Save config to ProjectData
  await prisma.projectData.update({
    where: { projectId },
    data: { siteConfigJson: siteConfig },
  });

  // If linked to a Site, push config to Site.previewConfig so the runtime can serve it
  if (project.siteId) {
    await prisma.site.update({
      where: { id: project.siteId },
      data: {
        previewConfig: siteConfig,
        status: "PREVIEW",
      },
    });
  }

  await transitionStatus(projectId, ProjectStatus.PREVIEW_READY);
}
