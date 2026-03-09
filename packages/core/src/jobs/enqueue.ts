import {
  createQueue,
  QUEUE_NAMES,
  ScrapeJobData,
  ExtractJobData,
  DetectMissingJobData,
  GenerateCopyJobData,
  GenerateConfigJobData,
} from "./queue";

// Lazy-initialized queue instances
const queues = {
  scrape: null as ReturnType<typeof createQueue<ScrapeJobData>> | null,
  extract: null as ReturnType<typeof createQueue<ExtractJobData>> | null,
  detectMissing: null as ReturnType<typeof createQueue<DetectMissingJobData>> | null,
  generateCopy: null as ReturnType<typeof createQueue<GenerateCopyJobData>> | null,
  generateConfig: null as ReturnType<typeof createQueue<GenerateConfigJobData>> | null,
};

export async function enqueueScrape(projectId: string) {
  if (!queues.scrape) queues.scrape = createQueue<ScrapeJobData>(QUEUE_NAMES.SCRAPE);
  await queues.scrape.add("scrape", { projectId }, { jobId: `scrape-${projectId}-${Date.now()}` });
}

export async function enqueueExtract(projectId: string) {
  if (!queues.extract) queues.extract = createQueue<ExtractJobData>(QUEUE_NAMES.EXTRACT);
  await queues.extract.add("extract", { projectId }, { jobId: `extract-${projectId}-${Date.now()}` });
}

export async function enqueueDetectMissing(projectId: string) {
  if (!queues.detectMissing)
    queues.detectMissing = createQueue<DetectMissingJobData>(QUEUE_NAMES.DETECT_MISSING);
  await queues.detectMissing.add("detect-missing", { projectId }, { jobId: `missing-${projectId}-${Date.now()}` });
}

export async function enqueueGenerateCopy(projectId: string) {
  if (!queues.generateCopy)
    queues.generateCopy = createQueue<GenerateCopyJobData>(QUEUE_NAMES.GENERATE_COPY);
  await queues.generateCopy.add("generate-copy", { projectId }, { jobId: `copy-${projectId}-${Date.now()}` });
}

export async function enqueueGenerateConfig(projectId: string) {
  if (!queues.generateConfig)
    queues.generateConfig = createQueue<GenerateConfigJobData>(QUEUE_NAMES.GENERATE_CONFIG);
  await queues.generateConfig.add("generate-config", { projectId }, { jobId: `config-${projectId}-${Date.now()}` });
}
