/**
 * Worker script — runs BullMQ workers for all pipeline queues.
 * Run with: npm run worker (or npx tsx scripts/worker.ts)
 */
import "dotenv/config";
import { startWorkers } from "@forge/core";

startWorkers();

// Keep the process alive
process.on("SIGINT", () => {
  console.log("Shutting down workers...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down workers...");
  process.exit(0);
});
