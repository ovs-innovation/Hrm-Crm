import os from 'os';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function run(cmd, args = [], timeout = 8000) {
  try {
    const { stdout } = await execFileAsync(cmd, args, {
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
    return String(stdout || '').trim();
  } catch {
    return null;
  }
}

function readProc(path) {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function parseMeminfo(raw) {
  if (!raw) return null;
  const get = (key) => {
    const m = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
    return m ? Number(m[1]) * 1024 : null;
  };
  const total = get('MemTotal');
  const available = get('MemAvailable');
  if (total == null) return null;
  const used = available != null ? total - available : null;
  return {
    totalMb: Math.round(total / (1024 * 1024)),
    usedMb: used != null ? Math.round(used / (1024 * 1024)) : null,
    percent: used != null && total > 0 ? Math.round((used / total) * 1000) / 10 : null,
  };
}

function parseLoadavg(raw) {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 3) return null;
  return {
    load1: Number(parts[0]),
    load5: Number(parts[1]),
    load15: Number(parts[2]),
  };
}

async function sampleCpuPercent(sampleMs = 400) {
  const cpus1 = os.cpus();
  if (!cpus1?.length) return null;
  const sum = (cpus) =>
    cpus.reduce(
      (acc, c) => {
        const t = c.times;
        acc.idle += t.idle;
        acc.total += t.user + t.nice + t.sys + t.idle + t.irq;
        return acc;
      },
      { idle: 0, total: 0 }
    );
  const a = sum(cpus1);
  await new Promise((r) => setTimeout(r, sampleMs));
  const b = sum(os.cpus());
  const idle = b.idle - a.idle;
  const total = b.total - a.total;
  if (total <= 0) return null;
  return Math.round((1 - idle / total) * 1000) / 10;
}

function parseDf(stdout) {
  if (!stdout) return null;
  const lines = stdout.split('\n').slice(1).filter(Boolean);
  const mounts = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 6) continue;
    const [filesystem, size, used, avail, usePct, mountpoint] = parts;
    if (!mountpoint || mountpoint.startsWith('/snap')) continue;
    mounts.push({
      filesystem,
      mount: mountpoint,
      sizeKb: Number(size) || null,
      usedKb: Number(used) || null,
      availKb: Number(avail) || null,
      percent: Number(String(usePct).replace('%', '')) || null,
    });
  }
  if (!mounts.length) return null;
  const root = mounts.find((m) => m.mount === '/') || mounts[0];
  return {
    rootPercent: root?.percent ?? null,
    mounts,
  };
}

function parseProcNetDev(raw) {
  if (!raw) return null;
  const lines = raw.split('\n').slice(2);
  let rx = 0;
  let tx = 0;
  for (const line of lines) {
    const m = line.match(/^\s*([^:]+):\s*(.*)$/);
    if (!m) continue;
    const name = m[1].trim();
    if (name === 'lo') continue;
    const cols = m[2].trim().split(/\s+/);
    rx += Number(cols[0]) || 0;
    tx += Number(cols[8]) || 0;
  }
  return { rxBytes: rx, txBytes: tx };
}

async function collectDocker() {
  const out = await run('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}']);
  if (out == null) return { available: false, containers: [] };
  const containers = out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [id, name, status, image] = line.split('\t');
      return { id, name, status, image };
    });
  return { available: true, containers };
}

async function collectPm2() {
  const out = await run('pm2', ['jlist']);
  if (out == null) return { available: false, processes: [] };
  try {
    const list = JSON.parse(out);
    const processes = (Array.isArray(list) ? list : []).map((p) => ({
      name: p.name,
      pid: p.pid,
      status: p.pm2_env?.status || p.status,
      cpu: p.monit?.cpu ?? null,
      memoryMb: p.monit?.memory != null ? Math.round(p.monit.memory / (1024 * 1024)) : null,
      restarts: p.pm2_env?.restart_time ?? null,
    }));
    return { available: true, processes };
  } catch {
    return { available: false, processes: [] };
  }
}

async function collectNginx() {
  const version = await run('nginx', ['-v']);
  const stub = await run('curl', ['-sS', '--max-time', '2', 'http://127.0.0.1/nginx_status']);
  let activeConnections = null;
  let accepts = null;
  let handled = null;
  let requests = null;
  if (stub) {
    const active = stub.match(/Active connections:\s*(\d+)/i);
    const stats = stub.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/m);
    if (active) activeConnections = Number(active[1]);
    if (stats) {
      accepts = Number(stats[1]);
      handled = Number(stats[2]);
      requests = Number(stats[3]);
    }
  }
  const available = version != null || stub != null;
  return {
    available,
    version: version || null,
    activeConnections,
    accepts,
    handled,
    requests,
  };
}

const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

function parseOpensslCert(text) {
  if (!text) return null;
  const notAfter = text.match(/notAfter=(.+)/)?.[1]?.trim();
  const notBefore = text.match(/notBefore=(.+)/)?.[1]?.trim();
  const domains = [...text.matchAll(/DNS:([^\s,]+)/g)].map((m) => m[1].toLowerCase());
  const expiry = notAfter ? new Date(notAfter) : null;
  if (!expiry || Number.isNaN(expiry.getTime())) return null;
  const daysRemaining = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  return {
    notBefore: notBefore ? new Date(notBefore).toISOString() : null,
    notAfter: expiry.toISOString(),
    daysRemaining,
    domains,
    status: daysRemaining < 0 ? 'expired' : daysRemaining <= 30 ? 'expiring' : 'valid',
  };
}

async function collectCertbot() {
  const liveRoot = '/etc/letsencrypt/live';
  const entries = listDir(liveRoot);
  if (!entries) return { available: false, certificates: [] };

  const certificates = [];
  for (const ent of entries) {
    if (!SAFE_NAME.test(ent.name) || ent.name === 'README') continue;
    const certPath = path.join(liveRoot, ent.name, 'cert.pem');
    const text = await run('openssl', ['x509', '-in', certPath, '-noout', '-enddate', '-startdate', '-ext', 'subjectAltName']);
    const parsed = parseOpensslCert(text);
    if (!parsed) continue;
    certificates.push({
      name: ent.name,
      ...parsed,
    });
  }
  certificates.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return { available: true, certificates };
}

function cronSchedule(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 6) return null;
  const schedule = parts.slice(0, 5).join(' ');
  if (!/^[\d*,/-]+(\s[\d*,/-]+){4}$/.test(schedule)) return null;
  return schedule;
}

function nextCronRun(schedule) {
  const fields = schedule.split(' ');
  if (fields.some((f) => /[-/,]/.test(f))) return null;
  const now = new Date();
  const minute = fields[0] === '*' ? null : Number(fields[0]);
  const hour = fields[1] === '*' ? null : Number(fields[1]);
  if ([minute, hour].some((n) => n != null && !Number.isFinite(n))) return null;
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  if (hour == null) {
    candidate.setMinutes(minute == null ? 0 : minute);
    if (candidate <= now) candidate.setHours(candidate.getHours() + 1);
  } else {
    candidate.setHours(hour, minute == null ? 0 : minute, 0, 0);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
  }
  if (fields[2] !== '*' || fields[3] !== '*' || fields[4] !== '*') return null;
  return candidate.toISOString();
}

function collectCronDir(dir, cadence) {
  const entries = listDir(dir);
  if (!entries) return [];
  const jobs = [];
  for (const ent of entries) {
    if (!ent.isFile() || ent.name.startsWith('.') || !SAFE_NAME.test(ent.name)) continue;
    const full = path.join(dir, ent.name);
    const raw = readProc(full);
    if (raw == null) {
      jobs.push({ name: ent.name, source: cadence, schedule: null, nextRun: null, lastRun: null, status: 'installed' });
      continue;
    }
    const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const scheduled = lines.map(cronSchedule).filter(Boolean);
    if (!scheduled.length) {
      jobs.push({ name: ent.name, source: cadence, schedule: cadence, nextRun: null, lastRun: null, status: 'installed' });
      continue;
    }
    for (const schedule of scheduled.slice(0, 3)) {
      jobs.push({
        name: ent.name,
        source: cadence,
        schedule,
        nextRun: nextCronRun(schedule),
        lastRun: null,
        status: 'scheduled',
      });
    }
  }
  return jobs;
}

function collectCron() {
  const jobs = [
    ...collectCronDir('/etc/cron.d', 'cron.d'),
    ...collectCronDir('/etc/cron.hourly', 'hourly'),
    ...collectCronDir('/etc/cron.daily', 'daily'),
    ...collectCronDir('/etc/cron.weekly', 'weekly'),
  ].slice(0, 40);
  return { available: jobs.length > 0, jobs };
}

export async function collectAll() {
  const [cpuPercent, dfOut, docker, pm2, nginx, certbot] = await Promise.all([
    sampleCpuPercent(),
    run('df', ['-kP']),
    collectDocker(),
    collectPm2(),
    collectNginx(),
    collectCertbot(),
  ]);
  const cron = collectCron();

  const mem = parseMeminfo(readProc('/proc/meminfo')) || {
    totalMb: Math.round(os.totalmem() / (1024 * 1024)),
    usedMb: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024)),
    percent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 1000) / 10,
  };

  const load = parseLoadavg(readProc('/proc/loadavg')) || {
    load1: os.loadavg()[0],
    load5: os.loadavg()[1],
    load15: os.loadavg()[2],
  };

  const disk = parseDf(dfOut);
  const network = parseProcNetDev(readProc('/proc/net/dev'));

  return {
    collectedAt: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    uptimeSec: Math.floor(os.uptime()),
    cpu: {
      percent: cpuPercent,
      cores: os.cpus()?.length ?? null,
      model: os.cpus()?.[0]?.model || null,
      load,
    },
    memory: mem,
    disk,
    network,
    docker,
    pm2,
    nginx,
    certbot,
    cron,
  };
}
