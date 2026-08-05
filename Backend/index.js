import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes, { whatsappWebhookRouter } from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import designationRoutes from './routes/designationRoutes.js';
import payslipRoutes from './routes/payslipRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import appreciationRoutes from './routes/appreciationRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import callRoutes from './routes/callRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import importRoutes from './routes/importRoutes.js';
import aiRoutes from './routes/ai.routes.js';
import billingRoutes from './routes/billingRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import executiveRoutes from './routes/executiveRoutes.js';
import { app, server } from './socket/socket.js';
import { resolveTenant } from './middlewares/tenantMiddleware.js';
import { contextMiddleware } from './middlewares/contextMiddleware.js';

await connectDB();

const __dirname = path.resolve();

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5174')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    let originHost = '';
    try {
      originHost = new URL(origin).hostname;
    } catch (e) {
      originHost = origin;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const isAllowed = allowedOrigins.includes(origin) ||
      (!isProd && (
        allowedOrigins.some(o => o.includes(originHost)) ||
        originHost === 'localhost' ||
        originHost.endsWith('127.0.0.1')
      )) ||
      originHost.endsWith('vastoratech.com');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin "${origin}" not allowed.`));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit exceeded. Please wait before sending more AI requests.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// ─── Tenant & Context Middleware ──────────────────────────────────────────────
app.use(resolveTenant);
app.use(contextMiddleware);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/messages', standardLimiter, messageRoutes);
app.use('/api/whatsapp/webhook', whatsappWebhookRouter);
app.use('/api/users', standardLimiter, userRoutes);
app.use('/api/employees', standardLimiter, employeeRoutes);
app.use('/api/leaves', standardLimiter, leaveRoutes);
app.use('/api/holidays', standardLimiter, holidayRoutes);
app.use('/api/attendance', standardLimiter, attendanceRoutes);
app.use('/api/tasks', standardLimiter, taskRoutes);
app.use('/api/clients', standardLimiter, clientRoutes);
app.use('/api/projects', standardLimiter, projectRoutes);
app.use('/api/announcements', standardLimiter, announcementRoutes);
app.use('/api/reports', standardLimiter, reportRoutes);
app.use('/api/deals', standardLimiter, dealRoutes);
app.use('/api/dashboard', standardLimiter, dashboardRoutes);
app.use('/api/departments', standardLimiter, departmentRoutes);
app.use('/api/designations', standardLimiter, designationRoutes);
app.use('/api/payslips', standardLimiter, payslipRoutes);
app.use('/api/shifts', standardLimiter, shiftRoutes);
app.use('/api/appreciations', standardLimiter, appreciationRoutes);
app.use('/api/tickets', standardLimiter, ticketRoutes);
app.use('/api/jobs', standardLimiter, jobRoutes);
app.use('/api/meetings', standardLimiter, meetingRoutes);
app.use('/api/calls', standardLimiter, callRoutes);
app.use('/api/campaigns', standardLimiter, campaignRoutes);
app.use('/api/documents', standardLimiter, documentRoutes);
app.use('/api/settings', standardLimiter, settingsRoutes);
app.use('/api/activities', standardLimiter, activityRoutes);
app.use('/api/notifications', standardLimiter, notificationRoutes);
app.use('/api/audit', standardLimiter, auditRoutes);
app.use('/api/invoices', standardLimiter, invoiceRoutes);
app.use('/api/search', standardLimiter, searchRoutes);
app.use('/api/import', standardLimiter, importRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/billing', standardLimiter, billingRoutes);
app.use('/api/demo', standardLimiter, demoRoutes);
app.use('/api/executive', standardLimiter, executiveRoutes);

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// ─── Health / Readiness ───────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', service: 'Vastora API', version: '1.0.0-rc2' }));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
  res.json({ status: 'ready', database: 'connected' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ message: 'Internal server error.' });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`✅ Vastora Server started on port ${port}`));

const shutdown = async (signal) => {
  console.log(`[Shutdown] ${signal} received — closing server`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('[Shutdown] MongoDB connection closed');
    } catch (e) {
      console.error('[Shutdown] Mongo close error', e.message);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
