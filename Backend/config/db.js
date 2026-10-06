import crypto from 'crypto';
import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

async function ensureDevAdmin() {
  const { default: Tenant } = await import('../models/Tenant.js');
  const { default: Admin } = await import('../models/Admin.js');
  const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');

  await withoutTenantScope(async () => {
    let tenant = await Tenant.findOne({ subdomain: 'default' });
    if (!tenant) {
      tenant = await Tenant.create({
        _id: '64a100000000000000000001',
        companyName: 'Default Trial Tenant',
        subdomain: 'default',
        apiKey: crypto.randomBytes(24).toString('hex'),
        plan: 'Enterprise',
        isActive: true,
        limits: { maxEmployees: 250, maxLeads: 5000, maxWorkflows: 50 },
        billingStatus: 'Active',
      });
    }

    const email = 'admin@vastora.tech';
    const existing = await Admin.findOne({ email });
    if (!existing) {
      await Admin.create({
        name: 'Vastora Admin',
        email,
        password: 'Vastora#Admin2026',
        role: 'Admin',
        tenantId: tenant._id,
      });
      console.log('Dev admin created: admin@vastora.tech');
    }

    const { restoreSavedEmployees } = await import('../utils/employeeStore.js');
    await restoreSavedEmployees();
    const { restoreSavedAttendance } = await import('../utils/attendanceStore.js');
    await restoreSavedAttendance();
    const { restoreSavedWfh } = await import('../utils/wfhStore.js');
    await restoreSavedWfh();
  });
}

async function connectUri(uri, label) {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 4000,
  });
  console.log(`MongoDB Connected (${label}): ${conn.connection.host}`);
  if (process.env.NODE_ENV !== 'production') {
    await ensureDevAdmin();
  }
  return conn;
}

async function connectMemoryFallback() {
  try {
    return await connectUri('mongodb://127.0.0.1:27017/hrm', 'localhost');
  } catch {
    /* no local mongod */
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'hrm' },
  });
  globalThis.__hrmMongod = mongod;
  return connectUri(mongod.getUri(), 'local fallback');
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing in Backend/.env');
    if (process.env.NODE_ENV === 'production') return undefined;
    return connectMemoryFallback();
  }

  try {
    return await connectUri(uri, 'MONGO_URI');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.log('Starting local MongoDB fallback so login can work...');
    return connectMemoryFallback();
  }
};

export default connectDB;
