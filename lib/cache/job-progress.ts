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

// ============================================
// Single Task Jobs (for intelligence features)
// ============================================

export type SingleTaskStatus = 'pending' | 'generating' | 'completed' | 'error'

export interface SingleTaskJob {
  jobId: string
  tripId: string
  feature: string
  status: SingleTaskStatus
  result?: any
  error?: string
  updatedAt: Date
}

// Separate cache for single-task jobs
const singleTaskCache = new Map<string, SingleTaskJob>()

/**
 * Initialize a single-task job (for intelligence features like packing)
 */
export function initializeSingleTaskJob(
  jobId: string,
  tripId: string,
  feature: string
): void {
  singleTaskCache.set(jobId, {
    jobId,
    tripId,
    feature,
    status: 'pending',
    updatedAt: new Date()
  })
}

/**
 * Update single-task job status to generating
 */
export function markSingleTaskGenerating(jobId: string): void {
  const existing = singleTaskCache.get(jobId)
  if (!existing) {
    throw new Error(`Single task job ${jobId} not found`)
  }
  
  singleTaskCache.set(jobId, {
    ...existing,
    status: 'generating',
    updatedAt: new Date()
  })
}

/**
 * Mark single-task job as completed with result
 */
export function completeSingleTaskJob(jobId: string, result: any): void {
  const existing = singleTaskCache.get(jobId)
  if (!existing) {
    throw new Error(`Single task job ${jobId} not found`)
  }
  
  singleTaskCache.set(jobId, {
    ...existing,
    status: 'completed',
    result,
    updatedAt: new Date()
  })
}

/**
 * Mark single-task job as failed with error
 */
export function failSingleTaskJob(jobId: string, error: string): void {
  const existing = singleTaskCache.get(jobId)
  if (!existing) {
    throw new Error(`Single task job ${jobId} not found`)
  }
  
  singleTaskCache.set(jobId, {
    ...existing,
    status: 'error',
    error,
    updatedAt: new Date()
  })
}

/**
 * Get single-task job status
 */
export function getSingleTaskJob(jobId: string): SingleTaskJob | null {
  return singleTaskCache.get(jobId) || null
}

/**
 * Delete a single-task job from cache
 */
export function deleteSingleTaskJob(jobId: string): void {
  singleTaskCache.delete(jobId)
}

/**
 * Clean up old single-task jobs (older than 1 hour)
 */
export function cleanupOldSingleTaskJobs(): number {
  const now = Date.now()
  const oneHour = 3600000
  let cleaned = 0
  
  for (const [jobId, job] of singleTaskCache.entries()) {
    if (now - job.updatedAt.getTime() > oneHour) {
      singleTaskCache.delete(jobId)
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Get all active single-task jobs (for debugging)
 */
export function getAllSingleTaskJobs(): SingleTaskJob[] {
  return Array.from(singleTaskCache.values())
}
