import dotenv from 'dotenv';
import { startWorker } from './services/queue.js';

dotenv.config();

console.log(`
╔═══════════════════════════════════════════╗
║    🔧 MeetingMind Background Worker      ║
║                                           ║
║  Starting job processing worker...        ║
╚═══════════════════════════════════════════╝
`);

// Start the worker
const worker = startWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing worker');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing worker');
  await worker.close();
  process.exit(0);
});
