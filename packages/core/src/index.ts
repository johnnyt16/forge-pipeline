// DB
export { prisma } from "./db/client";

// Pipeline
export { transitionStatus, forceStatus, publishToSite, getNextAction } from "./pipeline/status";

// Scraper
export { scrapeWebsite } from "./scraper/scraper";

// AI modules
export { extractBusinessData } from "./ai/extract";
export { detectMissingInfo } from "./ai/missing";
export { generateCopy } from "./ai/generate-copy";
export { generateSiteConfig } from "./ai/generate-config";
export { aiComplete } from "./ai/provider";

// Builder (static site export)
export { renderStaticSite, writeSite, getSitesDir } from "./builder";
export type { BuildOutput, BuildOptions, WriteSiteOptions } from "./builder";

// Sites / multi-tenant
export { resolveSiteFromHostname, getSiteFeatures } from "./sites/resolve";
export type { SiteFeatures } from "./sites/resolve";

// Jobs
export { startWorkers } from "./jobs/workers";
export {
  enqueueScrape,
  enqueueExtract,
  enqueueDetectMissing,
  enqueueGenerateCopy,
  enqueueGenerateConfig,
} from "./jobs/enqueue";
export { QUEUE_NAMES } from "./jobs/queue";

// Re-export Prisma types
export {
  ProjectStatus,
  SiteType,
  SiteStatus,
  TemplateFamily,
} from "@prisma/client";

export type {
  Project,
  ScrapedPage,
  ProjectData,
  Site,
  Domain,
  FormSubmission,
} from "@prisma/client";
