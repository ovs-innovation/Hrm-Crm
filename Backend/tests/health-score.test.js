import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthReasons } from '../infrastructure/services/healthScore.js';

test('health reasons flag disk and ssl without inventing pm2', () => {
  const reasons = buildHealthReasons({
    cpuUsage: 23,
    ramUsage: 41,
    diskUsage: 77,
    sslSoon: 2,
    sslExpired: 0,
    pm2Total: 0,
    dockerTotal: 0,
    backupsTotal: 0,
  });
  assert.equal(reasons.find((r) => r.key === 'cpu').level, 'ok');
  assert.equal(reasons.find((r) => r.key === 'disk').level, 'warn');
  assert.match(reasons.find((r) => r.key === 'disk').text, /77%/);
  assert.match(reasons.find((r) => r.key === 'ssl').text, /30 days/);
  assert.equal(reasons.find((r) => r.key === 'pm2'), undefined);
});

test('health reasons mark down processes', () => {
  const reasons = buildHealthReasons({
    cpuUsage: 96,
    pm2Down: 1,
    pm2Total: 9,
    dockerDown: 0,
    dockerTotal: 3,
    backupsFailed: 0,
    backupsTotal: 1,
    sslSoon: 0,
    sslExpired: 1,
  });
  assert.equal(reasons.find((r) => r.key === 'cpu').level, 'bad');
  assert.equal(reasons.find((r) => r.key === 'pm2').level, 'bad');
  assert.equal(reasons.find((r) => r.key === 'docker').level, 'ok');
  assert.equal(reasons.find((r) => r.key === 'ssl').level, 'bad');
  assert.equal(reasons.find((r) => r.key === 'backup').text, 'Backup OK');
});
