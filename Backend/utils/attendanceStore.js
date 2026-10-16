import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(path.resolve(), 'data', 'attendance.json');
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

/** Fire-and-forget JSON mirror — never blocks the request path. */
export const rememberAttendance = (record) => {
  const employeeId = String(record.employeeId || '');
  const date = String(record.date || '');
  if (!employeeId || !date) return;

  writeQueue = writeQueue
    .then(async () => {
      const list = (await readList()).filter(
        (row) => !(String(row.employeeId) === employeeId && row.date === date)
      );
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
      await writeList(list);
    })
    .catch((err) => console.error('[attendanceStore]', err.message));
};

export const restoreSavedAttendance = async () => {
  const { default: Attendance } = await import('../models/Attendance.js');
  const { default: Employee } = await import('../models/Employee.js');
  const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');
  const saved = await readList();
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
