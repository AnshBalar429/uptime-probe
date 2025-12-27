import { Worker, Job } from 'bullmq';
import {Redis} from 'ioredis';
import axios from 'axios';
import dotenv from 'dotenv';
import { checkWebsite } from './monitor.js';

dotenv.config();

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, 
});

const REGION = process.env.AZURE_REGION_CODE || 'local';
const API_REPORT_URL = `${process.env.API_BASE_URL}/reports`;

console.log(`Probe started. Region: [${REGION}]`);

// Initialize Worker
const worker = new Worker(
  `monitor-${REGION}`, 
  async (job: Job) => {
    const { websiteId, url, regionId } = job.data;
    
    console.log(`🔍 Checking: ${url}`);
    const result = await checkWebsite(url);

    // Report back to the Central Dashboard API
    try {
      await axios.post(API_REPORT_URL, {
        websiteId,
        regionId,
        latency: result.latency,
        statusCode: result.statusCode,
        status: result.status
      });
      console.log(`Reported ${url}: ${result.status} (${result.latency}ms)`);
    } catch (reportError: any) {
      console.error(`Failed to report result for ${url}:`, reportError.message);
    }
  }, 
  { 
    connection,
    concurrency: 50 
  }
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});

worker.on('error', err => {
  console.error(`Worker Error:`, err);
});