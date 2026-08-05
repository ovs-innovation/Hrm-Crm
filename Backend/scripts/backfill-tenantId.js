/**
 * Backfill tenantId on all business collections that are missing it.
 * Safe to re-run. Uses default tenant (subdomain: default) or TENANT_ID env.
 *
 * Usage: node scripts/backfill-tenantId.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';

const COLLECTIONS = [
  'admins',
  'employees',
  'clients',
  'deals',
  'invoices',
  'tasks',
  'leaverequests',
  'attendances',
  'dailyreports',
  'payslips',
  'departments',
  'designations',
  'projects',
  'announcements',
  'holidays',
  'appreciations',
  'tickets',
  'jobpostings',
  'jobapplications',
  'meetings',
  'calls',
  'campaigns',
  'documents',
  'messages',
  'notifications',
  'activities',
  'auditlogs',
  'shiftrosters',
  'companysettings',
  'promptconfigs',
  'invitetokens',
  'memories',
  'learnings',
  'knowledgedocs',
  'ailogs',
  'workflows',
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  let tenant;
  if (process.env.TENANT_ID) {
    tenant = await Tenant.findById(process.env.TENANT_ID);
  } else {
    tenant = await Tenant.findOne({ subdomain: 'default' });
  }
  if (!tenant) {
    console.error('No default tenant found. Start the API once in development or set TENANT_ID.');
    process.exit(1);
  }

  console.log(`Backfilling tenantId=${tenant._id} (${tenant.companyName})`);

  for (const name of COLLECTIONS) {
    try {
      const col = mongoose.connection.collection(name);
      const result = await col.updateMany(
        { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] },
        { $set: { tenantId: tenant._id } }
      );
      if (result.modifiedCount > 0) {
        console.log(`  ${name}: updated ${result.modifiedCount}`);
      }
    } catch (err) {
      console.warn(`  ${name}: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
