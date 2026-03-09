import { Job, Worker } from "bullmq";
import {
  createWorker,
  QUEUE_NAMES,
  ScrapeJobData,
  ExtractJobData,
  DetectMissingJobData,
  GenerateCopyJobData,
  GenerateConfigJobData,
} from "./queue";
import { scrapeWebsite } from "../scraper/scraper";
import { extractBusinessData } from "../ai/extract";
import { detectMissingInfo } from "../ai/missing";
import { generateCopy } from "../ai/generate-copy";
import { generateSiteConfig } from "../ai/generate-config";
import { transitionStatus } from "../pipeline/status";
import { ProjectStatus } from "@prisma/client";

/**
 * Start all workers. Returns them so the caller can shut down gracefully.
 */
export function startWorkers(): Worker[] {
  console.log("Starting pipeline workers...");

  const workers: Worker[] = [];

  // Scrape worker
  workers.push(
    createWorker<ScrapeJobData>(QUEUE_NAMES.SCRAPE, async (job: Job<ScrapeJobData>) => {
      console.log(`[scrape] Starting for project ${job.data.projectId}`);
      await scrapeWebsite(job.data.projectId);
    }),
  );

  // Extract worker
  workers.push(
    createWorker<ExtractJobData>(QUEUE_NAMES.EXTRACT, async (job: Job<ExtractJobData>) => {
      console.log(`[extract] Starting for project ${job.data.projectId}`);
      await extractBusinessData(job.data.projectId);
    }),
  );

  // Detect missing info worker
  workers.push(
    createWorker<DetectMissingJobData>(QUEUE_NAMES.DETECT_MISSING, async (job: Job<DetectMissingJobData>) => {
      console.log(`[detect-missing] Starting for project ${job.data.projectId}`);
      await detectMissingInfo(job.data.projectId);
    }),
  );

  // Generate copy worker
  workers.push(
    createWorker<GenerateCopyJobData>(QUEUE_NAMES.GENERATE_COPY, async (job: Job<GenerateCopyJobData>) => {
      console.log(`[generate-copy] Starting for project ${job.data.projectId}`);
      await transitionStatus(job.data.projectId, ProjectStatus.GENERATING);
      await generateCopy(job.data.projectId);
    }),
  );

  // Generate site config worker
  workers.push(
    createWorker<GenerateConfigJobData>(QUEUE_NAMES.GENERATE_CONFIG, async (job: Job<GenerateConfigJobData>) => {
      console.log(`[generate-config] Starting for project ${job.data.projectId}`);
      await generateSiteConfig(job.data.projectId);
    }),
  );

  console.log("All workers started.");
  return workers;
}
