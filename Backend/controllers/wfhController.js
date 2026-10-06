import fs from 'fs';
import path from 'path';
import Attendance from '../models/Attendance.js';
import WfhSession from '../models/WfhSession.js';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import Admin from '../models/Admin.js';
import { rememberWfh } from '../utils/wfhStore.js';
import { notifyMany } from '../utils/notify.js';

const localDate = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const mins = (seconds) => Math.round((seconds || 0) / 60);

const snapshot = (row) => ({
  employeeId: row.employeeId,
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
});

const liveStatus = (row) => {
  if (!row?.lastPulseAt) return 'logged_out';
  const age = Date.now() - new Date(row.lastPulseAt).getTime();
  if (age > 90 * 1000) return 'logged_out';
  return row.status || 'online';
};

export const pulse = async (req, res) => {
  if (req.userType !== 'Employee') {
    return res.status(403).json({ message: 'Only an employee can send a work pulse.' });
  }
  const date = localDate();
  const attendance = await Attendance.findOne({ employeeId: req.user._id, date });
  if (!attendance || attendance.workMode !== 'Home') {
    return res.status(400).json({ message: 'Work tracking runs only after a Home check-in.' });
  }
  if (attendance.checkOut) {
    return res.status(400).json({ message: 'Shift is already closed.' });
  }

  const elapsed = Math.min(60, Math.max(1, Number(req.body.elapsed) || 30));
  const requested = req.body.status === 'break' ? 'break' : 'online';
  const idle = Boolean(req.body.idle);
  const status = requested === 'break' ? 'break' : idle ? 'away' : 'online';
  const page = String(req.body.page || '/').slice(0, 80);
  const inputs = Math.min(500, Math.max(0, Number(req.body.inputs) || 0));

  let row = await WfhSession.findOne({ employeeId: req.user._id, date });
  if (!row) {
    row = new WfhSession({ employeeId: req.user._id, tenantId: req.user.tenantId, date });
  }
  if (status === 'break') row.breakSeconds += elapsed;
  else if (status === 'away') row.idleSeconds += elapsed;
  else row.activeSeconds += elapsed;
  row.status = status;
  row.lastPulseAt = new Date();
  row.inputCount += inputs;
  const pages = row.pages || [];
  const hit = pages.find((p) => p.path === page);
  if (hit) hit.seconds += elapsed;
  else pages.push({ path: page, seconds: elapsed });
  row.pages = pages.slice(-30);
  await row.save();
  rememberWfh(snapshot(row));
  res.json({ status: row.status, activeMinutes: mins(row.activeSeconds), idleMinutes: mins(row.idleSeconds), breakMinutes: mins(row.breakSeconds) });
};

const addSpan = (list, name, elapsed) => {
  const label = String(name || '').trim().slice(0, 120);
  if (!label) return list || [];
  const rows = list || [];
  const hit = rows.find((p) => p.path === label);
  if (hit) hit.seconds += elapsed;
  else rows.push({ path: label, seconds: elapsed });
  return rows.slice(-40);
};

const BROWSERS = ['chrome', 'msedge', 'firefox', 'brave', 'opera'];
const MEETING_APPS = ['zoom', 'teams', 'webex', 'skype'];

const saveJpeg = (employeeId, bytes, prefix) => {
  const dir = path.join(path.resolve(), 'uploads', 'wfh');
  fs.mkdirSync(dir, { recursive: true });
  const file = `${prefix}-${employeeId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
  fs.writeFileSync(path.join(dir, file), bytes);
  return `/uploads/wfh/${file}`;
};

const jpegBytes = (dataUrl) => {
  const raw = String(dataUrl || '');
  if (!raw.startsWith('data:image/jpeg;base64,')) return null;
  if (raw.length > 700_000) return null;
  return Buffer.from(raw.split(',')[1], 'base64');
};

const hostOf = (value) => {
  try {
    return new URL(value).hostname.replace(/^www\./, '').slice(0, 120);
  } catch {
    return '';
  }
};

export const agentPulse = async (req, res) => {
  if (req.userType !== 'Employee') {
    return res.status(403).json({ message: 'The desktop agent signs in as the employee.' });
  }
  const date = localDate();
  const elapsed = Math.min(60, Math.max(1, Number(req.body.elapsed) || 30));
  const idleFor = Math.max(0, Number(req.body.idleSeconds) || 0);
  const requested = ['break', 'meeting'].includes(req.body.status) ? req.body.status : 'working';
  const status = requested === 'working' && idleFor >= 180 ? 'away' : requested;
  const appName = String(req.body.app || '').slice(0, 80);
  const windowTitle = String(req.body.window || '').slice(0, 160);
  const inputs = Math.min(5000, Math.max(0, Number(req.body.inputs) || 0));
  const clicks = Math.min(5000, Math.max(0, Number(req.body.clicks) || 0));
  const keys = Math.min(5000, Math.max(0, Number(req.body.keys) || 0));
  const meetingApp = MEETING_APPS.some((name) => appName.toLowerCase().includes(name));
  const resolved = meetingApp ? 'meeting' : status;

  let row = await WfhSession.findOne({ employeeId: req.user._id, date });
  if (!row) row = new WfhSession({ employeeId: req.user._id, tenantId: req.user.tenantId, date });
  const wasBreak = row.status === 'break';
  if (resolved === 'break') row.breakSeconds += elapsed;
  else if (resolved === 'away') row.idleSeconds += elapsed;
  else row.activeSeconds += elapsed;
  if (resolved === 'break' && !wasBreak) row.breakCount = (row.breakCount || 0) + 1;
  row.status = resolved;
  row.lastPulseAt = new Date();
  row.inputCount += inputs + clicks + keys;
  row.mouseClicks = (row.mouseClicks || 0) + clicks;
  row.keyCount = (row.keyCount || 0) + keys;
  if (appName) row.apps = addSpan(row.apps, appName, elapsed);
  const site = hostOf(req.body.url) || (BROWSERS.some((name) => appName.toLowerCase().includes(name)) ? windowTitle : '');
  if (site) row.sites = addSpan(row.sites, site, elapsed);
  if (req.body.project) row.projects = addSpan(row.projects, req.body.project, elapsed);

  const files = Array.isArray(req.body.files) ? req.body.files.slice(0, 20) : [];
  for (const file of files) {
    const action = ['created', 'modified', 'deleted', 'opened'].includes(file.action) ? file.action : '';
    const name = String(file.name || '').split(/[\\/]/).pop().slice(0, 120);
    if (!action || !name) continue;
    row.files = [...(row.files || []), { at: new Date(), action, name }].slice(-80);
  }

  const shotBytes = jpegBytes(req.body.screenshot);
  const shotGap = row.lastShotAt ? Date.now() - new Date(row.lastShotAt).getTime() : Infinity;
  if (shotBytes && shotGap >= 9 * 60 * 1000) {
    const saved = saveJpeg(req.user._id, shotBytes, 'shot');
    row.shots = [...(row.shots || []), { at: new Date(), path: saved }].slice(-48);
    row.lastShotAt = new Date();
  }

  await row.save();
  rememberWfh(snapshot(row));

  const admins = async () => Admin.find({ tenantId: req.user.tenantId }).select('_id');
  const warn = async (flag, title, message) => {
    if (row.alerts?.[flag]) return;
    row.alerts = { ...(row.alerts?.toObject?.() || row.alerts || {}), [flag]: true };
    row.markModified('alerts');
    await row.save();
    const list = await admins();
    await notifyMany(list.map((a) => a._id), { userType: 'Admin', title, message, link: '/hrm/wfh', module: 'hrm' }).catch(() => {});
  };
  if (idleFor >= 15 * 60) await warn('idle', 'WFH idle', `${req.user.name} has been idle for ${Math.round(idleFor / 60)} min.`);
  if (idleFor >= 20 * 60) await warn('quiet', 'No WFH activity', `${req.user.name} has had no activity for ${Math.round(idleFor / 60)} min.`);
  const total = row.activeSeconds + row.idleSeconds + row.breakSeconds;
  if (total >= 2 * 60 * 60 && row.activeSeconds / total < 0.5) {
    await warn('low', 'Low WFH productivity', `${req.user.name} is under 50% productive today.`);
  }
  if ((row.breakCount || 0) >= 4 || row.breakSeconds >= 90 * 60) {
    await warn('breaks', 'Long WFH breaks', `${req.user.name} has taken repeated or long breaks.`);
  }
  const attendance = await Attendance.findOne({ employeeId: req.user._id, date });
  if (String(attendance?.status || '').toLowerCase().includes('late')) {
    await warn('late', 'Late WFH login', `${req.user.name} checked in late.`);
  }

  res.json({
    status: row.status,
    activeMinutes: mins(row.activeSeconds),
    idleMinutes: mins(row.idleSeconds),
    breakMinutes: mins(row.breakSeconds),
    productivity: total ? Math.round((row.activeSeconds / total) * 100) : 0,
  });
};

export const mySession = async (req, res) => {
  const date = req.query.date || localDate();
  const employeeId = req.userType === 'Employee' ? req.user._id : req.query.employeeId;
  if (!employeeId) return res.status(400).json({ message: 'Employee is required.' });
  const [attendance, session] = await Promise.all([
    Attendance.findOne({ employeeId, date }),
    WfhSession.findOne({ employeeId, date }),
  ]);
  res.json({
    date,
    workMode: attendance?.workMode || null,
    checkIn: attendance?.checkIn || null,
    checkOut: attendance?.checkOut || null,
    attendanceStatus: attendance?.status || null,
    tracking: Boolean(attendance?.workMode === 'Home' && !attendance?.checkOut),
    status: liveStatus(session),
    activeMinutes: mins(session?.activeSeconds),
    idleMinutes: mins(session?.idleSeconds),
    breakMinutes: mins(session?.breakSeconds),
    inputCount: session?.inputCount || 0,
    pages: (session?.pages || []).map((p) => ({ path: p.path, minutes: mins(p.seconds) })),
    apps: (session?.apps || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
    sites: (session?.sites || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
    shots: session?.shots || [],
    projects: (session?.projects || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
    files: session?.files || [],
    mouseClicks: session?.mouseClicks || 0,
    keyCount: session?.keyCount || 0,
    log: session?.log || { completed: '', pending: '', tomorrow: '', remarks: '' },
  });
};

export const saveLog = async (req, res) => {
  if (req.userType !== 'Employee') {
    return res.status(403).json({ message: 'Only an employee can file a work log.' });
  }
  const date = localDate();
  const attendance = await Attendance.findOne({ employeeId: req.user._id, date });
  if (!attendance || attendance.workMode !== 'Home') {
    return res.status(400).json({ message: 'Work log is for a Home day.' });
  }
  let row = await WfhSession.findOne({ employeeId: req.user._id, date });
  if (!row) row = new WfhSession({ employeeId: req.user._id, tenantId: req.user.tenantId, date });
  row.log = {
    completed: String(req.body.completed || '').slice(0, 2000),
    pending: String(req.body.pending || '').slice(0, 2000),
    tomorrow: String(req.body.tomorrow || '').slice(0, 2000),
    remarks: String(req.body.remarks || '').slice(0, 2000),
  };
  await row.save();
  rememberWfh(snapshot(row));
  res.json({ log: row.log });
};

export const board = async (req, res) => {
  if (req.userType === 'Employee') {
    return res.status(403).json({ message: 'Admin view only.' });
  }
  const date = req.query.date || localDate();
  const homeRows = await Attendance.find({ date, workMode: 'Home' }).populate('employeeId', 'name email employeeId designation');
  const sessions = await WfhSession.find({ date }).populate('employeeId', 'name email employeeId designation');
  const byEmployee = new Map();
  for (const session of sessions) byEmployee.set(String(session.employeeId?._id || session.employeeId), session);
  const seen = new Set(homeRows.map((row) => String(row.employeeId?._id || row.employeeId)));
  const extra = sessions
    .filter((session) => !seen.has(String(session.employeeId?._id || session.employeeId)))
    .map((session) => ({ employeeId: session.employeeId, checkIn: null, checkOut: null, status: null }));
  const rows = [...homeRows, ...extra];

  const people = rows.map((row) => {
    const session = byEmployee.get(String(row.employeeId?._id || row.employeeId));
    const active = session?.activeSeconds || 0;
    const idle = session?.idleSeconds || 0;
    const brk = session?.breakSeconds || 0;
    const productive = active + idle + brk;
    return {
      employeeId: row.employeeId?._id || row.employeeId,
      name: row.employeeId?.name || 'Employee',
      email: row.employeeId?.email || '',
      code: row.employeeId?.employeeId || '',
      designation: row.employeeId?.designation || '',
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      attendanceStatus: row.status,
      status: row.checkOut ? 'logged_out' : liveStatus(session),
      activeMinutes: mins(active),
      idleMinutes: mins(idle),
      breakMinutes: mins(brk),
      loginMinutes: mins(productive),
      productivity: productive ? Math.round((active / productive) * 100) : 0,
      inputCount: session?.inputCount || 0,
      pages: (session?.pages || []).map((p) => ({ path: p.path, minutes: mins(p.seconds) })),
      apps: (session?.apps || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
      sites: (session?.sites || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
      shots: session?.shots || [],
      projects: (session?.projects || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
      files: (session?.files || []).slice(-20),
      mouseClicks: session?.mouseClicks || 0,
      keyCount: session?.keyCount || 0,
      log: session?.log || null,
    };
  });

  const count = (status) => people.filter((p) => p.status === status).length;
  let tasks = { open: 0, progress: 0, done: 0 };
  try {
    const ids = people.map((p) => p.employeeId);
    const list = await Task.find({ assignedTo: { $in: ids } }).select('status');
    for (const task of list) {
      const s = String(task.status || '').toLowerCase();
      if (s.includes('complete') || s === 'done') tasks.done += 1;
      else if (s.includes('progress')) tasks.progress += 1;
      else tasks.open += 1;
    }
  } catch {
    tasks = { open: 0, progress: 0, done: 0 };
  }

  const late = people.filter((p) => String(p.attendanceStatus || '').toLowerCase().includes('late')).length;
  res.json({
    date,
    summary: {
      total: people.length,
      online: count('online') + count('working'),
      working: count('working'),
      meeting: count('meeting'),
      away: count('away'),
      break: count('break'),
      offline: count('logged_out'),
      late,
      activeMinutes: people.reduce((n, p) => n + p.activeMinutes, 0),
      idleMinutes: people.reduce((n, p) => n + p.idleMinutes, 0),
    },
    tasks,
    people,
  });
};

export const report = async (req, res) => {
  if (req.userType === 'Employee') {
    return res.status(403).json({ message: 'Admin view only.' });
  }
  const from = req.query.from || localDate();
  const to = req.query.to || from;
  const sessions = await WfhSession.find({ date: { $gte: from, $lte: to } });
  const employees = await Employee.find({ _id: { $in: sessions.map((s) => s.employeeId) } }).select('name employeeId department');
  const names = new Map(employees.map((e) => [String(e._id), e]));
  const attendance = await Attendance.find({ date: { $gte: from, $lte: to }, workMode: 'Home' }).select('employeeId date status');
  const lateKeys = new Set(attendance.filter((row) => String(row.status || '').toLowerCase().includes('late')).map((row) => `${row.employeeId}:${row.date}`));
  const lines = sessions.map((s) => {
    const person = names.get(String(s.employeeId));
    const total = (s.activeSeconds || 0) + (s.idleSeconds || 0) + (s.breakSeconds || 0);
    return {
      date: s.date,
      name: person?.name || 'Employee',
      code: person?.employeeId || '',
      department: person?.department || '',
      status: s.status,
      activeMinutes: mins(s.activeSeconds),
      idleMinutes: mins(s.idleSeconds),
      breakMinutes: mins(s.breakSeconds),
      productivity: total ? Math.round((s.activeSeconds / total) * 100) : 0,
      late: lateKeys.has(`${s.employeeId}:${s.date}`),
      mouseClicks: s.mouseClicks || 0,
      keyCount: s.keyCount || 0,
      apps: (s.apps || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
      sites: (s.sites || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
      projects: (s.projects || []).map((p) => ({ name: p.path, minutes: mins(p.seconds) })),
      shots: (s.shots || []).length,
      log: s.log,
    };
  });
  const byDept = {};
  for (const line of lines) {
    const key = line.department || 'Unassigned';
    if (!byDept[key]) byDept[key] = { department: key, people: 0, productivity: 0 };
    byDept[key].people += 1;
    byDept[key].productivity += line.productivity;
  }
  const departments = Object.values(byDept).map((row) => ({ ...row, productivity: row.people ? Math.round(row.productivity / row.people) : 0 }));
  res.json({ from, to, lines, departments });
};
