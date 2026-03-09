import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

// Shared Redis connection
let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

// Job type definitions
export interface ScrapeJobData {
  projectId: string;
}

export interface ExtractJobData {
  projectId: string;
}

export interface DetectMissingJobData {
  projectId: string;
}

export interface GenerateCopyJobData {
  projectId: string;
}

export interface GenerateConfigJobData {
  projectId: string;
}

// Queue names
export const QUEUE_NAMES = {
  SCRAPE: "scrape-site",
  EXTRACT: "extract-data",
  DETECT_MISSING: "detect-missing-info",
  GENERATE_COPY: "generate-copy",
  GENERATE_CONFIG: "generate-site-config",
} as const;

// Create queues
export function createQueue<T>(name: string): Queue<T> {
  return new Queue<T>(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
    },
  });
}

// Create a worker for a queue
export function createWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  const worker = new Worker<T>(name, processor, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`[${name}] Job ${job.id} completed for project ${(job.data as { projectId: string }).projectId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[${name}] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
