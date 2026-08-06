import { redisClient } from './redis.service.js';
import logger from '../utils/logger.js';

// Fallback in-memory job processing array if Redis is offline
const DLQ = [];
const jobsQueue = [];

export const addJob = async (queueName, jobName, data, opts = {}) => {
  const jobId = `${queueName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const job = {
    id: jobId,
    queue: queueName,
    name: jobName,
    data,
    attempts: 0,
    maxAttempts: opts.attempts || 3,
    status: 'waiting'
  };

  logger.info(`[Queue] Job Enqueued: ${jobName} on ${queueName}`, { jobId, queueName });

  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.hset(`queue:${queueName}:jobs`, jobId, JSON.stringify(job));
      await redisClient.lpush(`queue:${queueName}:waiting`, jobId);
      // Run background worker processing execution
      setTimeout(() => processJob(queueName), 50);
      return jobId;
    } catch (err) {
      logger.error(`[Queue] Redis push failed, falling back to memory queue`, { error: err.message });
    }
  }

  jobsQueue.push(job);
  setTimeout(() => processMemoryJob(), 50);
  return jobId;
};

// Process job from Redis lists
const processJob = async (queueName) => {
  if (!redisClient || redisClient.status !== 'ready') return;
  try {
    const jobId = await redisClient.rpop(`queue:${queueName}:waiting`);
    if (!jobId) return;

    const rawJob = await redisClient.hget(`queue:${queueName}:jobs`, jobId);
    if (!rawJob) return;

    const job = JSON.parse(rawJob);
    job.status = 'active';
    job.attempts += 1;
    await redisClient.hset(`queue:${queueName}:jobs`, jobId, JSON.stringify(job));

    logger.info(`[Queue Worker] Processing Job ${job.name}`, { jobId, attempts: job.attempts });

    // Execute job logic
    let success = true;
    try {
      await executeJobLogic(job);
    } catch (err) {
      success = false;
      logger.error(`[Queue Worker] Job failed: ${job.name}`, { jobId, error: err.message });
      
      if (job.attempts < job.maxAttempts) {
        job.status = 'waiting';
        await redisClient.hset(`queue:${queueName}:jobs`, jobId, JSON.stringify(job));
        await redisClient.lpush(`queue:${queueName}:waiting`, jobId); // Retry
      } else {
        job.status = 'failed';
        await redisClient.hset(`queue:${queueName}:jobs`, jobId, JSON.stringify(job));
        // Move to Dead Letter Queue (DLQ)
        await redisClient.hset(`queue:${queueName}:dlq`, jobId, JSON.stringify(job));
        logger.error(`[Queue Worker] Job moved to DLQ`, { jobId, queueName });
      }
    }

    if (success) {
      job.status = 'completed';
      await redisClient.hset(`queue:${queueName}:jobs`, jobId, JSON.stringify(job));
      // Cleanup completed job
      await redisClient.hdel(`queue:${queueName}:jobs`, jobId);
    }
  } catch (err) {
    logger.error(`[Queue Processor Error]`, { error: err.message });
  }
};

// Fallback memory job processor
const processMemoryJob = async () => {
  const job = jobsQueue.shift();
  if (!job) return;

  job.status = 'active';
  job.attempts += 1;
  logger.info(`[Memory Queue Worker] Processing Job ${job.name}`, { jobId: job.id });

  try {
    await executeJobLogic(job);
    job.status = 'completed';
  } catch (err) {
    logger.error(`[Memory Queue Worker] Job failed: ${job.name}`, { jobId: job.id, error: err.message });
    if (job.attempts < job.maxAttempts) {
      job.status = 'waiting';
      jobsQueue.push(job); // Retry push back
    } else {
      job.status = 'failed';
      DLQ.push(job); // DLQ push
    }
  }
};

// Dispatch tasks based on job details
const executeJobLogic = async (job) => {
  const { name, data } = job;
  if (name === 'sendEmail') {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
    await transporter.sendMail({
      from: '"Vastora OS" <inbox@vastora.com>',
      to: data.to,
      subject: data.subject,
      text: data.body
    });
  } else if (name === 'sendWhatsapp') {
    const { sendWhatsAppText } = await import('./whatsapp.service.js');
    await sendWhatsAppText({ to: data.to, body: data.message });
  } else if (name === 'processAI') {
    const { callLLM } = await import('./llm.service.js');
    await callLLM(data.prompt, data.options || {});
  }
};

export const getQueueStatus = () => {
  return {
    queueLength: jobsQueue.length,
    dlqLength: DLQ.length,
    redisConnected: Boolean(redisClient && redisClient.status === 'ready')
  };
};
