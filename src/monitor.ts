import axios from 'axios';

export interface CheckResult {
  latency: number;
  statusCode: number;
  status: 'UP' | 'DOWN';
}

export async function checkWebsite(url: string): Promise<CheckResult> {
  const start = performance.now();
  try {
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      validateStatus: () => true, // Don't throw error on 4xx/5xx codes
      headers: { 'User-Agent': 'UptimeMonitor-Probe/1.0' }
    });
    
    const end = performance.now();
    const latency = Math.round(end - start);

    return {
      latency,
      statusCode: response.status,
      status: response.status >= 200 && response.status < 400 ? 'UP' : 'DOWN'
    };
  } catch (error: any) {
    return {
      latency: 0,
      statusCode: error.response?.status || 0,
      status: 'DOWN'
    };
  }
}