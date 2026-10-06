import fs from 'fs';
import path from 'path';

const filePath = path.join(path.resolve(), 'data', 'employees.json');

const readList = () => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
};

const writeList = (list) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
};

export const rememberEmployee = (record) => {
  const email = String(record.email || '').toLowerCase().trim();
  if (!email) return;
  const list = readList().filter((row) => row.email !== email);
  const previous = readList().find((row) => row.email === email);
  list.push({
    _id: record._id || previous?._id,
    employeeId: record.employeeId,
    name: record.name,
    email,
    role: record.role || previous?.role || 'Employee',
    designation: record.designation || previous?.designation || '',
    department: record.department || previous?.department || '',
  });
  writeList(list);
};

export const forgetEmployee = (email) => {
  const key = String(email || '').toLowerCase().trim();
  writeList(readList().filter((row) => row.email !== key));
};

export const restoreSavedEmployees = async () => {
  const { default: Employee } = await import('../models/Employee.js');
  const { default: Tenant } = await import('../models/Tenant.js');
  const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');

  const saved = readList();
  if (!saved.length) return;

  await withoutTenantScope(async () => {
    const tenant = await Tenant.findOne({ subdomain: 'default' });
    if (!tenant) return;
    for (const row of saved) {
      const email = String(row.email || '').toLowerCase().trim();
      const exists = await Employee.findOne({ email });
      if (exists) {
        exists.name = row.name || exists.name;
        exists.designation = row.designation || exists.designation;
        exists.department = row.department || exists.department;
        exists.role = row.role || exists.role;
        await exists.save();
        continue;
      }
      await Employee.create({
        ...row,
        _id: row._id || undefined,
        email,
        tenantId: tenant._id,
      });
    }
  });
  console.log(`Permanent employees restored: ${saved.length}`);
};
