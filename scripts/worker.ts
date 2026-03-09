/**
 * Worker script — runs BullMQ workers for all pipeline queues.
 * Run with: npm run worker (or npx tsx scripts/worker.ts)
 */
import "dotenv/config";
import { startWorkers } from "@forge/core";

const workers = startWorkers();

// Graceful shutdown — let in-progress jobs finish before exiting
async function shutdown() {
  console.log("Shutting down workers gracefully...");
  await Promise.all(workers.map((w) => w.close()));
  console.log("All workers closed.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
