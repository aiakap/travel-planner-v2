import { readFile, writeFile, appendFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getLogsDir } from "./file-utils";

export type QueueStatus = "pending" | "waiting" | "processing" | "completed" | "error";

export interface QueueItem {
  id: string;
  prompt: string;
  filename: string;
  status: QueueStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  apiCallId: string | null;
  outputPath: string | null;
}

export interface QueueData {
  prompts: QueueItem[];
}

export interface ApiCallLog {
  id: string;
  timestamp: string;
  promptId: string;
  model: string;
  status: "success" | "error";
  duration: number;
  response?: any;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
}

const QUEUE_FILE = "queue.json";
const API_LOG_FILE = "api-calls.jsonl";

/**
 * Get the path to the queue file
 */
function getQueueFilePath(): string {
  return join(process.cwd(), getLogsDir(), QUEUE_FILE);
}

/**
 * Get the path to the API log file
 */
function getApiLogFilePath(): string {
  return join(process.cwd(), getLogsDir(), API_LOG_FILE);
}

/**
 * Ensure logs directory exists
 */
async function ensureLogsDir(): Promise<void> {
  const logsDir = join(process.cwd(), getLogsDir());
  if (!existsSync(logsDir)) {
    await mkdir(logsDir, { recursive: true });
  }
}

/**
 * Read the queue from disk
 */
export async function readQueue(): Promise<QueueData> {
  await ensureLogsDir();
  const queuePath = getQueueFilePath();

  if (!existsSync(queuePath)) {
    return { prompts: [] };
  }

  try {
    const content = await readFile(queuePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading queue:", error);
    return { prompts: [] };
  }
}

/**
 * Write the queue to disk
 */
export async function writeQueue(queue: QueueData): Promise<void> {
  await ensureLogsDir();
  const queuePath = getQueueFilePath();
  await writeFile(queuePath, JSON.stringify(queue, null, 2), "utf-8");
}

/**
 * Add prompts to the queue
 */
export async function addToQueue(
  prompts: Array<{ id: string; prompt: string; filename: string }>
): Promise<void> {
  const queue = await readQueue();

  const now = new Date().toISOString();
  const newItems: QueueItem[] = prompts.map((p) => ({
    id: p.id,
    prompt: p.prompt,
    filename: p.filename,
    status: "pending" as QueueStatus,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    apiCallId: null,
    outputPath: null,
  }));

  queue.prompts.push(...newItems);
  await writeQueue(queue);
}

/**
 * Update a queue item's status
 */
export async function updateQueueItem(
  id: string,
  updates: Partial<QueueItem>
): Promise<void> {
  const queue = await readQueue();
  const item = queue.prompts.find((p) => p.id === id);

  if (!item) {
    throw new Error(`Queue item not found: ${id}`);
  }

  Object.assign(item, updates);
  await writeQueue(queue);
}

/**
 * Get the next pending item from the queue
 */
export async function getNextPendingItem(): Promise<QueueItem | null> {
  const queue = await readQueue();
  return queue.prompts.find((p) => p.status === "pending") || null;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  waiting: number;
  processing: number;
  completed: number;
  error: number;
}> {
  const queue = await readQueue();

  return {
    total: queue.prompts.length,
    pending: queue.prompts.filter((p) => p.status === "pending").length,
    waiting: queue.prompts.filter((p) => p.status === "waiting").length,
    processing: queue.prompts.filter((p) => p.status === "processing").length,
    completed: queue.prompts.filter((p) => p.status === "completed").length,
    error: queue.prompts.filter((p) => p.status === "error").length,
  };
}

/**
 * Log an API call
 */
export async function logApiCall(log: ApiCallLog): Promise<void> {
  await ensureLogsDir();
  const logPath = getApiLogFilePath();
  const logLine = JSON.stringify(log) + "\n";
  await appendFile(logPath, logLine, "utf-8");
}

/**
 * Clear the queue (for testing)
 */
export async function clearQueue(): Promise<void> {
  await writeQueue({ prompts: [] });
}

/**
 * Process the queue with concurrency control
 */
export async function processQueue(
  processFn: (item: QueueItem) => Promise<{
    success: boolean;
    apiCallId: string;
    outputPath?: string;
    errorMessage?: string;
  }>,
  maxConcurrent: number = 2
): Promise<void> {
  const queue = await readQueue();
  const pendingItems = queue.prompts.filter((p) => p.status === "pending");

  if (pendingItems.length === 0) {
    return;
  }

  // Process items with concurrency control
  const processing: Promise<void>[] = [];

  for (const item of pendingItems) {
    // Wait if we're at max concurrency
    if (processing.length >= maxConcurrent) {
      await Promise.race(processing);
      // Remove completed promises
      processing.splice(
        0,
        processing.length,
        ...processing.filter((p) => {
          let done = false;
          p.then(() => {
            done = true;
          });
          return !done;
        })
      );
    }

    // Start processing this item
    const promise = (async () => {
      try {
        // Update to processing
        await updateQueueItem(item.id, {
          status: "processing",
          startedAt: new Date().toISOString(),
        });

        // Process the item
        const result = await processFn(item);

        // Update based on result
        if (result.success) {
          await updateQueueItem(item.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            apiCallId: result.apiCallId,
            outputPath: result.outputPath || null,
          });
        } else {
          await updateQueueItem(item.id, {
            status: "error",
            completedAt: new Date().toISOString(),
            apiCallId: result.apiCallId,
            errorMessage: result.errorMessage || "Unknown error",
          });
        }
      } catch (error: any) {
        await updateQueueItem(item.id, {
          status: "error",
          completedAt: new Date().toISOString(),
          errorMessage: error.message || "Unknown error",
        });
      }
    })();

    processing.push(promise);
  }

  // Wait for all remaining items to complete
  await Promise.all(processing);
}
