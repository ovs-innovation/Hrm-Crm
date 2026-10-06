import fs from 'fs';
import path from 'path';

const filePath = path.join(path.resolve(), 'data', 'wfh.json');

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

export const rememberWfh = (record) => {
  const employeeId = String(record.employeeId || '');
  const date = String(record.date || '');
  if (!employeeId || !date) return;
  const list = readList().filter((row) => !(String(row.employeeId) === employeeId && row.date === date));
  list.push({
    employeeId,
    date,
    status: record.status,
    lastPulseAt: record.lastPulseAt || null,
    activeSeconds: record.activeSeconds || 0,
    idleSeconds: record.idleSeconds || 0,
    breakSeconds: record.breakSeconds || 0,
    inputCount: record.inputCount || 0,
    mouseClicks: record.mouseClicks || 0,
    keyCount: record.keyCount || 0,
    breakCount: record.breakCount || 0,
    pages: record.pages || [],
    apps: record.apps || [],
    sites: record.sites || [],
    projects: record.projects || [],
    files: record.files || [],
    shots: record.shots || [],
    lastShotAt: record.lastShotAt || null,
    alerts: record.alerts || {},
    log: record.log || {},
  });
  writeList(list);
};

export const restoreSavedWfh = async () => {
  const { default: WfhSession } = await import('../models/WfhSession.js');
  const { default: Employee } = await import('../models/Employee.js');
  const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');
  const saved = readList();
  if (!saved.length) return;
  await withoutTenantScope(async () => {
    for (const row of saved) {
      const employee = await Employee.findById(row.employeeId);
      if (!employee) continue;
      await WfhSession.findOneAndUpdate(
        { employeeId: employee._id, date: row.date },
        {
          employeeId: employee._id,
          tenantId: employee.tenantId,
          date: row.date,
          status: row.status,
          lastPulseAt: row.lastPulseAt,
          activeSeconds: row.activeSeconds,
          idleSeconds: row.idleSeconds,
          breakSeconds: row.breakSeconds,
          inputCount: row.inputCount,
          mouseClicks: row.mouseClicks,
          keyCount: row.keyCount,
          breakCount: row.breakCount,
          pages: row.pages,
          apps: row.apps,
          sites: row.sites,
          projects: row.projects,
          files: row.files,
          shots: row.shots,
          lastShotAt: row.lastShotAt,
          alerts: row.alerts,
          log: row.log,
        },
        { upsert: true, new: true }
      );
    }
  });
};
