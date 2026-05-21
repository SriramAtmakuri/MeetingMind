import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { processMeetingFile } from '../jobs/processor.js';

dotenv.config();

// Redis connection - supports both REDIS_URL (Render) and individual params (local)
const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

// Create processing queue
export const meetingQueue = new Queue('meeting-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
    },
  },
});

// Add job to queue
export async function addToProcessingQueue(meetingId, fileData) {
  try {
    const job = await meetingQueue.add(
      'process-meeting',
      {
        meetingId,
        ...fileData,
      },
      {
        jobId: meetingId, // Use meeting ID as job ID to prevent duplicates
      }
    );

    console.log(`Added job ${job.id} to processing queue`);
    return job;
  } catch (error) {
    console.error('Failed to add job to queue:', error);
    throw error;
  }
}

// Create worker (this should run in a separate process in production)
export function startWorker() {
  const worker = new Worker(
    'meeting-processing',
    async (job) => {
      console.log(`Processing job ${job.id}...`);

      try {
        await processMeetingFile(job.data);
        console.log(`Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS) || 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('🚀 Worker started and listening for jobs...');

  return worker;
}

// Get job status
export async function getJobStatus(jobId) {
  const job = await meetingQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}

export default meetingQueue;
