/**
 * In-memory cache for tracking background job progress
 * Can be upgraded to Redis for production scalability
 */

export interface JobResult {
  index: number
  status: 'success' | 'error' | 'pending'
  reservationId?: string
  error?: string
}

export interface JobProgress {
  jobId: string
  tripId: string
  total: number
  completed: number
  results: JobResult[]
  updatedAt: Date
}

// In-memory cache
const jobCache = new Map<string, JobProgress>()

/**
 * Initialize a new job
 */
export function initializeJob(jobId: string, tripId: string, total: number): void {
  const results: JobResult[] = []
  for (let i = 0; i < total; i++) {
    results.push({
      index: i,
      status: 'pending'
    })
  }
  
  jobCache.set(jobId, {
    jobId,
    tripId,
    total,
    completed: 0,
    results,
    updatedAt: new Date()
  })
}

/**
 * Update job progress with new results
 */
export function updateJobProgress(jobId: string, results: JobResult[]): void {
  const existing = jobCache.get(jobId)
  if (!existing) {
    throw new Error(`Job ${jobId} not found`)
  }
  
  jobCache.set(jobId, {
    ...existing,
    completed: results.filter(r => r.status !== 'pending').length,
    results,
    updatedAt: new Date()
  })
}

/**
 * Update a single result in the job
 */
export function updateJobResult(jobId: string, index: number, result: Omit<JobResult, 'index'>): void {
  const existing = jobCache.get(jobId)
  if (!existing) {
    throw new Error(`Job ${jobId} not found`)
  }
  
  const updatedResults = [...existing.results]
  updatedResults[index] = {
    index,
    ...result
  }
  
  jobCache.set(jobId, {
    ...existing,
    completed: updatedResults.filter(r => r.status !== 'pending').length,
    results: updatedResults,
    updatedAt: new Date()
  })
}

/**
 * Get job progress
 */
export function getJobProgress(jobId: string): JobProgress | null {
  return jobCache.get(jobId) || null
}

/**
 * Delete a job from cache
 */
export function deleteJob(jobId: string): void {
  jobCache.delete(jobId)
}

/**
 * Clean up old jobs (older than 1 hour)
 */
export function cleanupOldJobs(): number {
  const now = Date.now()
  const oneHour = 3600000
  let cleaned = 0
  
  for (const [jobId, progress] of jobCache.entries()) {
    if (now - progress.updatedAt.getTime() > oneHour) {
      jobCache.delete(jobId)
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Get all active jobs (for debugging)
 */
export function getAllJobs(): JobProgress[] {
  return Array.from(jobCache.values())
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
