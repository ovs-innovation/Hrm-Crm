import 'dotenv/config';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';

/**
 * Assign default tenant to Admin/Employee docs that predate multi-tenancy.
 * Does not print emails or change passwords.
 */
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  let tenant = await Tenant.findOne({ subdomain: 'default' });
  if (!tenant) {
    tenant = await Tenant.findOne({ subdomain: 'novatech-demo' });
  }
  if (!tenant) {
    console.error('No default/novatech tenant found');
    process.exit(1);
  }

  const filter = { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };

  const adminResult = await withoutTenantScope(() =>
    Admin.updateMany(filter, { $set: { tenantId: tenant._id } })
  );
  const empResult = await withoutTenantScope(() =>
    Employee.updateMany(filter, { $set: { tenantId: tenant._id } })
  );

  console.log(JSON.stringify({
    tenantSubdomain: tenant.subdomain,
    adminsUpdated: adminResult.modifiedCount,
    employeesUpdated: empResult.modifiedCount,
  }));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
