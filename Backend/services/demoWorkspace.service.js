/**
 * NovaTech Solutions Pvt. Ltd. — Official FCX Demo Workspace
 * Interconnected seed: employees ↔ attendance ↔ payroll ↔ deals ↔ leads ↔ AI memory
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { contextStorage } from '../middlewares/contextMiddleware.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';

import Tenant from '../models/Tenant.js';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Invoice from '../models/Invoice.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payslip from '../models/Payslip.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Meeting from '../models/Meeting.js';
import Call from '../models/Call.js';
import Campaign from '../models/Campaign.js';
import Announcement from '../models/Announcement.js';
import Appreciation from '../models/Appreciation.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import JobPosting from '../models/JobPosting.js';
import JobApplication from '../models/JobApplication.js';
import Ticket from '../models/Ticket.js';
import AILog from '../models/AILog.js';
import Memory from '../models/Memory.js';
import Holiday from '../models/Holiday.js';

export const DEMO_META = {
  subdomain: 'novatech-demo',
  companyName: 'NovaTech Solutions Pvt. Ltd.',
  industry: 'IT Services & SaaS',
  founded: 2018,
  hq: 'Bengaluru',
  branches: ['Bengaluru', 'Pune', 'Noida'],
  adminEmail: 'ceo@novatech.demo',
  hrEmail: 'hr@novatech.demo',
  salesEmail: 'sales@novatech.demo',
  password: process.env.DEMO_PASSWORD || 'Demo@NovaTech2026',
};

const FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Aadhya', 'Diya', 'Ira', 'Kiara', 'Myra', 'Sara', 'Anika', 'Navya', 'Pari',
  'Rohan', 'Kabir', 'Yash', 'Dev', 'Nikhil', 'Siddharth', 'Harsh', 'Manav', 'Om', 'Rishi',
  'Meera', 'Sneha', 'Pooja', 'Neha', 'Kavya', 'Isha', 'Tanvi', 'Riya', 'Shreya', 'Nisha',
];
const LAST = [
  'Sharma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Kapoor', 'Malhotra', 'Joshi', 'Desai',
  'Gupta', 'Khan', 'Singh', 'Chopra', 'Banerjee', 'Mukherjee', 'Pillai', 'Rao', 'Shetty', 'Verma',
];

const DEPTS = [
  { name: 'Engineering', head: 'Priya Kapoor' },
  { name: 'HR', head: 'Ananya Iyer' },
  { name: 'Sales', head: 'Vikram Mehta' },
  { name: 'Marketing', head: 'Sneha Reddy' },
  { name: 'Finance', head: 'Arjun Desai' },
  { name: 'Customer Success', head: 'Meera Nair' },
];

const DESIGS = [
  { title: 'CTO', department: 'Engineering', level: 'Director' },
  { title: 'Engineering Manager', department: 'Engineering', level: 'Manager' },
  { title: 'Senior Software Engineer', department: 'Engineering', level: 'Senior' },
  { title: 'Software Engineer', department: 'Engineering', level: 'Mid' },
  { title: 'HR Head', department: 'HR', level: 'Director' },
  { title: 'HR Business Partner', department: 'HR', level: 'Manager' },
  { title: 'HR Executive', department: 'HR', level: 'Mid' },
  { title: 'Sales Head', department: 'Sales', level: 'Director' },
  { title: 'Account Executive', department: 'Sales', level: 'Mid' },
  { title: 'SDR', department: 'Sales', level: 'Junior' },
  { title: 'Marketing Head', department: 'Marketing', level: 'Director' },
  { title: 'Content Lead', department: 'Marketing', level: 'Mid' },
  { title: 'Finance Head', department: 'Finance', level: 'Director' },
  { title: 'Accountant', department: 'Finance', level: 'Mid' },
  { title: 'CS Head', department: 'Customer Success', level: 'Director' },
  { title: 'Customer Success Manager', department: 'Customer Success', level: 'Manager' },
];

const CLIENT_COMPANIES = [
  'Acme Manufacturing', 'BluePeak Retail', 'Orbit Fintech', 'Cedar Health', 'PixelCraft Media',
  'Summit Logistics', 'Nimbus Cloud', 'Harbor Foods', 'Lumen Energy', 'Atlas Mobility',
  'Verde Agritech', 'Quest Education', 'Brightline Insurance', 'Cobalt Pharma', 'Spark Hotels',
  'Northwind Traders', 'Silverline Banks', 'Echo Telecom', 'Forge Industrial', 'Maple Softwares',
  'Zenith Apparel', 'Cascade Analytics', 'Prism Design', 'Urban Nest Realty', 'Falcon Aviation',
];

const DEAL_STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const clearTenantCollections = async (tenantId) => {
  const models = [
    Admin, Employee, Department, Designation, Client, Deal, Invoice, Attendance, LeaveRequest,
    Payslip, Task, Project, Meeting, Call, Campaign, Announcement, Appreciation, Document,
    Notification, Activity, JobPosting, JobApplication, Ticket, AILog, Memory, Holiday,
  ];
  await withoutTenantScope(async () => {
    for (const Model of models) {
      await Model.deleteMany({ tenantId });
    }
  });
};

const isoDate = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const workingDaysBack = (count) => {
  const out = [];
  let cursor = new Date();
  while (out.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) out.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return out;
};

const pick = (arr, i) => arr[i % arr.length];

export async function ensureNovaTechDemo({ force = false } = {}) {
  const started = Date.now();

  let tenant = await withoutTenantScope(() =>
    Tenant.findOne({ subdomain: DEMO_META.subdomain })
  );

  if (!tenant) {
    tenant = await Tenant.create({
      companyName: DEMO_META.companyName,
      subdomain: DEMO_META.subdomain,
      apiKey: crypto.randomBytes(24).toString('hex'),
      plan: 'Enterprise',
      isActive: true,
      limits: { maxEmployees: 250, maxLeads: 5000, maxWorkflows: 50 },
      billingStatus: 'Active',
      activePlugins: ['Payroll', 'Helpdesk', 'Assets', 'Training'],
    });
  }

  const tenantId = tenant._id;

  const existingCount = await withoutTenantScope(() =>
    Employee.countDocuments({ tenantId })
  );

  if (!force && existingCount >= 98) {
    const admin = await withoutTenantScope(() =>
      Admin.findOne({ tenantId, email: DEMO_META.adminEmail }).select('_id email name role')
    );
    return {
      created: false,
      tenantId,
      companyName: DEMO_META.companyName,
      stats: { employees: existingCount },
      login: {
        email: DEMO_META.adminEmail,
        password: DEMO_META.password,
      },
      adminId: admin?._id,
      durationMs: Date.now() - started,
    };
  }

  await clearTenantCollections(tenantId);
  const passwordHash = await bcrypt.hash(DEMO_META.password, 10);

  const summary = await contextStorage.run(
    { tenantId: String(tenantId), skipTenantScope: false },
    async () => seedInsideTenant({ tenantId, passwordHash })
  );

  return {
    created: true,
    tenantId,
    companyName: DEMO_META.companyName,
    stats: summary,
    login: {
      email: DEMO_META.adminEmail,
      password: DEMO_META.password,
    },
    durationMs: Date.now() - started,
  };
}

async function seedInsideTenant({ tenantId, passwordHash }) {
  // 6 Departments
  for (const d of DEPTS) {
    await Department.create({ ...d, status: 'Active', description: `${d.name} at NovaTech`, tenantId });
  }
  for (const d of DESIGS) {
    await Designation.create({ ...d, status: 'Active', tenantId });
  }

  // 100 Employees
  const roster = [];
  for (let idx = 1; idx <= 100; idx++) {
    const name = `${pick(FIRST, idx)} ${pick(LAST, idx + 3)}`;
    const email = idx === 1 ? DEMO_META.adminEmail : `employee${idx}@novatech.demo`;
    const dept = pick(DEPTS, idx).name;
    const desig = DESIGS.find((d) => d.department === dept) || DESIGS[0];
    roster.push({
      employeeId: `NT-${String(idx).padStart(3, '0')}`,
      name,
      email,
      department: dept,
      designation: desig.title,
      role: idx === 1 ? 'Manager' : 'Employee',
      branch: pick(DEMO_META.branches, idx),
      reportingTo: idx === 1 ? '' : 'Priya Kapoor',
      joinDate: isoDate(daysAgo(200 + (idx % 900))),
      about: `${desig.title} in ${dept}.`,
    });
  }

  const employeeDocs = roster.map((p, i) => ({
    ...p,
    password: passwordHash,
    country: 'India',
    mobile: `98${String(10000000 + i).slice(0, 8)}`,
    gender: i % 2 === 0 ? 'Male' : 'Female',
    language: 'English',
    address: `${DEMO_META.hq} — ${p.branch}`,
    tenantId,
  }));

  const employees = await Employee.insertMany(employeeDocs);

  // Admins
  await Admin.create({ name: 'Aisha Khan', email: DEMO_META.adminEmail, password: DEMO_META.password, role: 'Founder', tenantId });
  await Admin.create({ name: 'Ananya Iyer', email: DEMO_META.hrEmail, password: DEMO_META.password, role: 'HR', tenantId });
  await Admin.create({ name: 'Vikram Mehta', email: DEMO_META.salesEmail, password: DEMO_META.password, role: 'Sales', tenantId });

  // 250 Leads & 80 Customers (Total 330 Clients)
  const clients = [];
  for (let i = 0; i < 250; i++) {
    const company = `${pick(CLIENT_COMPANIES, i)} Lead-${i}`;
    clients.push({
      name: `${pick(FIRST, i)} ${pick(LAST, i)}`,
      company,
      email: `lead${i}@${company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example`,
      phone: `919000000${String(100 + i).slice(0, 3)}`,
      status: 'Lead',
      notes: 'Acquired through marketing campaigns.',
      tenantId,
      createdAt: daysAgo(i % 50),
    });
  }
  for (let i = 0; i < 80; i++) {
    const company = `${pick(CLIENT_COMPANIES, i)} Customer-${i}`;
    clients.push({
      name: `${pick(FIRST, i + 10)} ${pick(LAST, i + 10)}`,
      company,
      email: `customer${i}@${company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example`,
      phone: `918000000${String(100 + i).slice(0, 3)}`,
      status: 'Active',
      notes: 'Enterprise contract signed.',
      tenantId,
      createdAt: daysAgo(100 + i),
    });
  }
  const clientDocs = await Client.insertMany(clients);
  const leads = clientDocs.filter(c => c.status === 'Lead');
  const customers = clientDocs.filter(c => c.status === 'Active');

  // 45 Active Deals
  const deals = [];
  for (let i = 0; i < 45; i++) {
    const client = pick(clientDocs, i);
    deals.push({
      title: `${client.company} — Suite Pack`,
      amount: [250000, 500000, 800000, 1200000][i % 4],
      stage: pick(DEAL_STAGES, i),
      client: client._id,
      clientName: client.company,
      expectedCloseDate: daysAgo(-30),
      owner: 'Vikram Mehta',
      tenantId,
    });
  }
  const dealDocs = await Deal.insertMany(deals);

  // 150 Invoices (100 Paid)
  const invoices = [];
  for (let i = 0; i < 150; i++) {
    const client = pick(customers, i);
    const subtotal = 120000 + i * 5000;
    const taxAmount = Math.round(subtotal * 0.18);
    invoices.push({
      number: `INV-2026-${String(1000 + i)}`,
      type: 'Invoice',
      status: i < 100 ? 'Paid' : 'Overdue',
      client: client._id,
      clientName: client.company,
      items: [{ description: 'Cloud subscription', quantity: 1, rate: subtotal, amount: subtotal }],
      subtotal,
      taxRate: 18,
      taxAmount,
      total: subtotal + taxAmount,
      dueDate: daysAgo(i % 10),
      tenantId,
      createdAt: daysAgo(30 + i),
    });
  }
  await Invoice.insertMany(invoices);

  // 35 Projects
  const projects = [];
  for (let i = 0; i < 35; i++) {
    const client = pick(customers, i);
    projects.push({
      name: `Project Alpha-${i}`,
      client: client.company,
      technologies: 'React, Node, MongoDB',
      status: 'Active',
      priority: 'High',
      budget: 1500000,
      startDate: isoDate(daysAgo(100)),
      tenantId,
    });
  }
  const projectDocs = await Project.insertMany(projects);

  // 300 Tasks
  const tasks = [];
  for (let i = 0; i < 300; i++) {
    const emp = pick(employees, i);
    tasks.push({
      title: `Operational Task #${i}`,
      description: `Weekly task checklist details for ${emp.name}`,
      projectName: pick(projectDocs, i).name,
      assignedTo: emp.employeeId,
      assignedBy: 'Priya Kapoor',
      dueDate: isoDate(daysAgo(-(i % 15))),
      status: i % 2 === 0 ? 'Completed' : 'Pending',
      tenantId,
    });
  }
  await Task.insertMany(tasks);

  // 1200 Attendance Records
  const days = workingDaysBack(24);
  const attendance = [];
  for (const emp of employees.slice(0, 50)) { // limit to 50 employees to avoid MongoDB payload limit issues
    for (const date of days) {
      attendance.push({
        employeeId: emp._id,
        date,
        checkIn: '09:15 AM',
        checkOut: '06:30 PM',
        status: 'Completed',
        workMode: 'Office',
        tenantId,
      });
    }
  }
  await Attendance.insertMany(attendance);

  // 60 Leave Requests
  const leaves = [];
  for (let i = 0; i < 60; i++) {
    const emp = pick(employees, i);
    leaves.push({
      employeeId: emp._id,
      employeeName: emp.name,
      type: 'Casual',
      startDate: isoDate(daysAgo(-2)),
      endDate: isoDate(daysAgo(-3)),
      reason: 'Personal engagement',
      status: 'Approved',
      tenantId,
    });
  }
  await LeaveRequest.insertMany(leaves);

  // 90 Documents
  const docs = [];
  for (let i = 0; i < 90; i++) {
    docs.push({
      title: `Corporate Compliance Policy Doc #${i}`,
      fileName: `policy-note-${i}.pdf`,
      category: 'Policy',
      notes: 'Indexed contract template.',
      tenantId,
    });
  }
  await Document.insertMany(docs);

  // 120 Meetings & 180 Calls
  const meetings = [];
  for (let i = 0; i < 120; i++) {
    meetings.push({
      title: `Executive Performance Alignment Sync #${i}`,
      scheduledAt: daysAgo(-(i % 5)),
      duration: 30,
      status: 'Scheduled',
      tenantId,
    });
  }
  await Meeting.insertMany(meetings);

  const calls = [];
  for (let i = 0; i < 180; i++) {
    calls.push({
      subject: `Call follow-up #${i}`,
      calledAt: daysAgo(i % 10),
      duration: 60,
      status: 'Completed',
      tenantId,
    });
  }
  await Call.insertMany(calls);

  // 25 Support Tickets
  const tickets = [];
  for (let i = 0; i < 25; i++) {
    tickets.push({
      title: `IT Support VPN Connection Issue #${i}`,
      priority: 'High',
      status: 'Open',
      tenantId,
    });
  }
  await Ticket.insertMany(tickets);

  // 12 JobPostings / Active Recruitments
  const jobPostings = [];
  for (let i = 0; i < 12; i++) {
    jobPostings.push({
      title: `Staff Opening #${i}`,
      department: 'Engineering',
      status: 'Open',
      tenantId,
    });
  }
  const jobDocs = await JobPosting.insertMany(jobPostings);

  // 30 Job Applications
  const applications = [];
  for (let i = 0; i < 30; i++) {
    applications.push({
      job: pick(jobDocs, i)._id,
      name: `Applicant ${i}`,
      email: `applicant${i}@gmail.com`,
      status: 'Interview',
      tenantId,
    });
  }
  await JobApplication.insertMany(applications);

  return {
    employees: employees.length,
    leads: leads.length,
    customers: customers.length,
    deals: dealDocs.length,
  };
}

export default { ensureNovaTechDemo, DEMO_META };
