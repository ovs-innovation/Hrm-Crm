const mark = (ok, warn) => (ok ? 'ok' : warn ? 'warn' : 'bad');

/**
 * Explain a health score from already collected signals.
 * Missing signals are omitted. Nothing is invented.
 */
export const buildHealthReasons = ({
  cpuUsage = null,
  ramUsage = null,
  diskUsage = null,
  sslSoon = 0,
  sslExpired = 0,
  sslTotal = null,
  pm2Down = 0,
  pm2Total = 0,
  dockerDown = 0,
  dockerTotal = 0,
  backupsFailed = 0,
  backupsTotal = 0,
} = {}) => {
  const reasons = [];
  if (cpuUsage != null) {
    reasons.push({
      key: 'cpu',
      level: mark(cpuUsage < 85, cpuUsage < 95),
      text: cpuUsage < 85 ? 'CPU healthy' : `CPU ${cpuUsage}%`,
    });
  }
  if (ramUsage != null) {
    reasons.push({
      key: 'ram',
      level: mark(ramUsage < 85, ramUsage < 95),
      text: ramUsage < 85 ? 'RAM healthy' : `RAM ${ramUsage}%`,
    });
  }
  if (diskUsage != null) {
    reasons.push({
      key: 'disk',
      level: mark(diskUsage < 70, diskUsage < 90),
      text: diskUsage < 70 ? 'Disk healthy' : `Disk usage ${diskUsage}%`,
    });
  }
  if (sslExpired > 0) {
    reasons.push({ key: 'ssl', level: 'bad', text: `${sslExpired} SSL expired` });
  } else if (sslSoon > 0) {
    reasons.push({ key: 'ssl', level: 'warn', text: `SSL expires within 30 days (${sslSoon})` });
  } else if (sslTotal) {
    reasons.push({ key: 'ssl', level: 'ok', text: 'SSL healthy' });
  }
  if (pm2Total > 0) {
    reasons.push({
      key: 'pm2',
      level: pm2Down > 0 ? 'bad' : 'ok',
      text: pm2Down > 0 ? `${pm2Down} PM2 process down` : 'PM2 healthy',
    });
  }
  if (dockerTotal > 0) {
    reasons.push({
      key: 'docker',
      level: dockerDown > 0 ? 'bad' : 'ok',
      text: dockerDown > 0 ? `${dockerDown} container not running` : 'Docker healthy',
    });
  }
  if (backupsTotal > 0) {
    reasons.push({
      key: 'backup',
      level: backupsFailed > 0 ? 'bad' : 'ok',
      text: backupsFailed > 0 ? `${backupsFailed} backup failed` : 'Backup OK',
    });
  }
  return reasons;
};
