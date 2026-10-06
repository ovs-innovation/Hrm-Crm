import fs from 'fs';
import path from 'path';

const filePath = path.join(path.resolve(), 'data', 'attendance.json');

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

export const rememberAttendance = (record) => {
  const employeeId = String(record.employeeId || '');
  const date = String(record.date || '');
  if (!employeeId || !date) return;
  const list = readList().filter((row) => !(String(row.employeeId) === employeeId && row.date === date));
  list.push({
    employeeId,
    date,
    checkIn: record.checkIn || null,
    checkOut: record.checkOut || null,
    status: record.status,
    workMode: record.workMode,
    workedMinutes: record.workedMinutes ?? null,
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
    distanceFromOffice: record.distanceFromOffice ?? null,
  });
  writeList(list);
};

export const restoreSavedAttendance = async () => {
  const { default: Attendance } = await import('../models/Attendance.js');
  const { default: Employee } = await import('../models/Employee.js');
  const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');
  const saved = readList();
  if (!saved.length) return;

  await withoutTenantScope(async () => {
    for (const row of saved) {
      const employee = await Employee.findById(row.employeeId);
      if (!employee) continue;
      const existing = await Attendance.findOne({ employeeId: employee._id, date: row.date });
      if (existing) {
        existing.checkIn = row.checkIn;
        existing.checkOut = row.checkOut;
        existing.status = row.status;
        existing.workMode = row.workMode;
        existing.workedMinutes = row.workedMinutes;
        await existing.save();
        continue;
      }
      await Attendance.create({
        ...row,
        employeeId: employee._id,
        tenantId: employee.tenantId,
      });
    }
  });
  console.log(`Permanent attendance restored: ${saved.length}`);
};
