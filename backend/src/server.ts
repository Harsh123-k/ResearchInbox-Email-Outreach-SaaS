import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { authRouter } from './routes/authRoutes';
import { emailRouter } from './routes/emailRoutes';
import { slackRouter } from './routes/slackRoutes';
import { senderRouter } from './routes/senderRoutes';
import { emailQueue } from './services/queueService';
import { startEmailWorker } from './workers/emailWorker';
import { initElasticsearch } from './config/elasticsearch';
import { initEmailTransporter } from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Setup Bull Board Dashboard at /admin/queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

try {
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue) as any],
    serverAdapter: serverAdapter as any,
  });
  app.use('/admin/queues', serverAdapter.getRouter());
} catch (e: any) {
  console.warn('Bull Board mount warning:', e.message);
}

// 2. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ReachInbox Email Outreach API',
    time: new Date().toISOString(),
  });
});

// 3. API Routes
app.use('/api/auth', authRouter);
app.use('/api/emails', emailRouter);
app.use('/api/slack', slackRouter);
app.use('/api/senders', senderRouter);

// 4. Start Server and Background Services
const server = app.listen(PORT, () => {
  console.log(`✓ ReachInbox API Server running at http://localhost:${PORT}`);
  console.log(`✓ Bull Board Dashboard live at http://localhost:${PORT}/admin/queues`);

  // Non-blocking async service initialization
  initEmailTransporter().catch(console.error);
  initElasticsearch().catch(console.error);
  startEmailWorker();
});