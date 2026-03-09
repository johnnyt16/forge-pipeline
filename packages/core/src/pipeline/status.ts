import { ProjectStatus } from "@prisma/client";
import { prisma } from "../db/client";

/**
 * Valid state transitions for the project pipeline.
 * Each status maps to the statuses it can transition to.
 */
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  CREATED: [ProjectStatus.SCRAPING, ProjectStatus.FAILED],
  SCRAPING: [ProjectStatus.EXTRACTED, ProjectStatus.FAILED],
  EXTRACTED: [ProjectStatus.WAITING_FOR_MISSING_INFO, ProjectStatus.READY_TO_GENERATE, ProjectStatus.FAILED],
  WAITING_FOR_MISSING_INFO: [ProjectStatus.READY_TO_GENERATE, ProjectStatus.FAILED],
  READY_TO_GENERATE: [ProjectStatus.GENERATING, ProjectStatus.FAILED],
  GENERATING: [ProjectStatus.PREVIEW_READY, ProjectStatus.FAILED],
  PREVIEW_READY: [ProjectStatus.APPROVED, ProjectStatus.GENERATING, ProjectStatus.FAILED],
  APPROVED: [ProjectStatus.DEPLOYED, ProjectStatus.FAILED],
  DEPLOYED: [ProjectStatus.FAILED],
  FAILED: [ProjectStatus.CREATED], // allow retry from failed
};

/**
 * Transition a project to a new status. Throws if the transition is invalid.
 */
export async function transitionStatus(
  projectId: string,
  newStatus: ProjectStatus
): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  const allowed = VALID_TRANSITIONS[project.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${project.status} → ${newStatus}`
    );
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus },
  });
}

/**
 * Force-set status (for admin overrides / error recovery).
 */
export async function forceStatus(
  projectId: string,
  newStatus: ProjectStatus
): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus },
  });
}

/**
 * Approve a project and publish its config to the linked Site as liveConfig.
 * This is the bridge between pipeline completion and production serving.
 */
export async function publishToSite(projectId: string): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { projectData: true },
  });

  if (!project.siteId) {
    throw new Error("Project is not linked to a Site. Cannot publish.");
  }

  if (!project.projectData?.siteConfigJson) {
    throw new Error("No site config to publish. Run the pipeline first.");
  }

  // Copy siteConfig to both approvedJson and Site.liveConfig
  await prisma.projectData.update({
    where: { projectId },
    data: { approvedJson: project.projectData.siteConfigJson },
  });

  await prisma.site.update({
    where: { id: project.siteId },
    data: {
      liveConfig: project.projectData.siteConfigJson,
      status: "LIVE",
    },
  });

  await transitionStatus(projectId, ProjectStatus.APPROVED);
}

/**
 * Get the next logical action for a given status.
 */
export function getNextAction(status: ProjectStatus): string | null {
  const actions: Partial<Record<ProjectStatus, string>> = {
    CREATED: "scrape",
    EXTRACTED: "detect-missing",
    WAITING_FOR_MISSING_INFO: "generate",
    READY_TO_GENERATE: "generate",
    PREVIEW_READY: "approve",
    APPROVED: "deploy",
  };
  return actions[status] ?? null;
}
