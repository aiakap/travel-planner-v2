/**
 * Development Queue Processor
 * 
 * Hits the /api/process-image-queue endpoint every second for testing.
 * 
 * Usage:
 *   npm run dev (in one terminal)
 *   node scripts/process-queue-loop.ts (in another terminal)
 * 
 * Press Ctrl+C to stop
 */

const ENDPOINT = 'http://localhost:3000/api/process-image-queue';
const INTERVAL_MS = 60000; // 1 minute

let iteration = 0;

async function processQueue() {
  iteration++;
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`\n[${timestamp}] Iteration #${iteration} - Processing queue...`);
    
    const response = await fetch(ENDPOINT);
    const result = await response.json();
    
    if (result.success) {
      if (result.processed > 0) {
        console.log(`✅ Processed ${result.processed} job(s)`);
        
        // Show details of each processed job
        if (result.results && Array.isArray(result.results)) {
          result.results.forEach((job: any) => {
            if (job.success) {
              console.log(`   ✓ ${job.id}: Image generated successfully`);
              if (job.imageUrl) {
                console.log(`     → ${job.imageUrl}`);
              }
            } else {
              console.log(`   ✗ ${job.id}: ${job.error}`);
            }
          });
        }
      } else {
        console.log(`⏸️  No jobs in queue (idle)`);
      }
    } else {
      console.log(`❌ Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to process queue: ${error.message}`);
  }
}

// Start the loop
console.log('🚀 Starting queue processor...');
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   Interval: ${INTERVAL_MS}ms (${INTERVAL_MS / 1000}s)`);
console.log(`   Press Ctrl+C to stop\n`);

// Process immediately, then every interval
processQueue();
setInterval(processQueue, INTERVAL_MS);
