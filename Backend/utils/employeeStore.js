import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(path.resolve(), 'data', 'employees.json');
let writeQueue = Promise.resolve();

const readList = async () => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeList = async (list) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(list, null, 2));
};

/** Fire-and-forget mirror. Passwords are never written. */
export const rememberEmployee = (record) => {
  const email = String(record.email || '').toLowerCase().trim();
  if (!email) return;

  writeQueue = writeQueue
    .then(async () => {
      const current = await readList();
      const previous = current.find((row) => row.email === email);
      const list = current.filter((row) => row.email !== email);
      list.push({
        _id: record._id || previous?._id,
        employeeId: record.employeeId,
        name: record.name,
        email,
        role: record.role || previous?.role || 'Employee',
        designation: record.designation || previous?.designation || '',
        department: record.department || previous?.department || '',
      });
      await writeList(list);
    })
    .catch((err) => console.error('[employeeStore]', err.message));
};

export const forgetEmployee = (email) => {
  const key = String(email || '').toLowerCase().trim();
  writeQueue = writeQueue
    .then(async () => {
      const list = (await readList()).filter((row) => row.email !== key);
      await writeList(list);
    })
    .catch((err) => console.error('[employeeStore]', err.message));
};

export const restoreSavedEmployees = async () => {
  const { default: Employee } = await import('../models/Employee.js');
  const { default: Tenant } = await import('../models/Tenant.js');
  const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');

  const saved = await readList();
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
      const { password: _ignored, ...safeRow } = row;
      await Employee.create({
        ...safeRow,
        _id: row._id || undefined,
        email,
        tenantId: tenant._id,
      });
    }
  });
  console.log(`Permanent employees restored: ${saved.length}`);
};
