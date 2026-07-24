import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
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
import { app, server } from './socket/socket.js';

connectDB();

const __dirname = path.resolve();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/appreciations', appreciationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/import', importRoutes);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => res.send('Server is ready'));

const port = process.env.PORT || 5000;

server.listen(port, () => console.log(`Server started on port ${port}`));
