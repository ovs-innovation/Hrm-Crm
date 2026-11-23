import tls from 'tls';
import InfraDomain from '../models/InfraDomain.js';
import InfraSsl from '../models/InfraSsl.js';
import { raiseAlert } from './alertService.js';
import { writeInfraLog } from './logService.js';

export const daysUntil = (date) => {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
};

export const domainStatusFromExpiry = (expiryDate, reminderDays = 30) => {
  const days = daysUntil(expiryDate);
  if (days == null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= reminderDays) return 'expiring_soon';
  return 'healthy';
};

export const sslStatusFromExpiry = (expiryDate) => {
  const days = daysUntil(expiryDate);
  if (days == null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'healthy';
};

/** Live TLS certificate read — issued + expiry from peer certificate. */
export const fetchLiveSslCertificate = (host, port = 443) =>
  new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host,
        port: Number(port) || 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: 10000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(true);
          socket.end();
          if (!cert || (!cert.valid_to && !cert.valid_from)) {
            resolve(null);
            return;
          }
          resolve({
            domain: host,
            issuer: cert.issuer
              ? Object.values(cert.issuer).filter(Boolean).join(', ')
              : '',
            subject: cert.subject?.CN || host,
            issuedDate: cert.valid_from ? new Date(cert.valid_from) : null,
            expiryDate: cert.valid_to ? new Date(cert.valid_to) : null,
            fingerprint: cert.fingerprint || '',
          });
        } catch (err) {
          reject(err);
        }
      }
    );
    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('SSL peek timeout'));
    });
  });

const parseRdapExpiry = (data) => {
  if (!data || typeof data !== 'object') return null;
  const events = Array.isArray(data.events) ? data.events : [];
  const exp = events.find((e) =>
    ['expiration', 'expiry', 'expire', 'registration expiration'].includes(
      String(e.eventAction || '').toLowerCase()
    )
  );
  if (exp?.eventDate) {
    const d = new Date(exp.eventDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Some registrars nest entities; scan shallow events only — return null if unknown
  return null;
};

const parseRdapRegistrar = (data) => {
  const entities = Array.isArray(data?.entities) ? data.entities : [];
  for (const ent of entities) {
    const roles = (ent.roles || []).map((r) => String(r).toLowerCase());
    if (roles.includes('registrar')) {
      const vcard = ent.vcardArray?.[1];
      if (Array.isArray(vcard)) {
        const fn = vcard.find((row) => row[0] === 'fn');
        if (fn?.[3]) return String(fn[3]);
      }
      if (ent.handle) return String(ent.handle);
    }
  }
  return '';
};

/**
 * Query public RDAP for domain expiry. Falls back to null when RDAP unavailable.
 */
export const fetchDomainExpiryViaRdap = async (domain) => {
  const name = String(domain || '').trim().toLowerCase().replace(/\.$/, '');
  if (!name || !name.includes('.')) return null;

  const urls = [
    `https://rdap.org/domain/${encodeURIComponent(name)}`,
    `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(name)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/rdap+json, application/json' },
        signal: AbortSignal.timeout(12000),
        redirect: 'follow',
      });
      if (!res.ok) continue;
      const data = await res.json();
      const expiryDate = parseRdapExpiry(data);
      if (!expiryDate) continue;
      return {
        expiryDate,
        registrar: parseRdapRegistrar(data),
        source: 'rdap',
        rawStatus: Array.isArray(data.status) ? data.status : [],
      };
    } catch {
      /* try next */
    }
  }
  return null;
};

export const refreshDomainStatuses = async (tenantId) => {
  const rows = await InfraDomain.find({ tenantId }).limit(500);
  for (const row of rows) {
    const prev = row.status;
    let live = null;

    // Prefer live RDAP when no stored expiry, or when last check is older than 24h
    const stale =
      !row.lastCheckedAt ||
      Date.now() - new Date(row.lastCheckedAt).getTime() > 24 * 3600 * 1000;

    if (stale || !row.expiryDate) {
      try {
        live = await fetchDomainExpiryViaRdap(row.domain);
      } catch (err) {
        await writeInfraLog({
          tenantId,
          category: 'error',
          level: 'warn',
          message: `RDAP failed for ${row.domain}: ${err.message}`,
        });
      }
    }

    if (live?.expiryDate) {
      row.expiryDate = live.expiryDate;
      if (live.registrar && !row.registrar) row.registrar = live.registrar;
      row.expirySource = 'rdap';
    } else if (row.expiryDate || row.renewalDate) {
      row.expirySource = row.expirySource || 'metadata';
    }

    row.lastCheckedAt = new Date();
    row.status = domainStatusFromExpiry(row.expiryDate || row.renewalDate, row.reminderDaysBefore || 30);
    await row.save();

    const days = daysUntil(row.expiryDate || row.renewalDate);
    if (row.status === 'expired' || row.status === 'expiring_soon') {
      await raiseAlert({
        tenantId,
        type: 'domain_expiring',
        severity: row.status === 'expired' ? 'critical' : 'warning',
        title: `Domain ${row.status === 'expired' ? 'expired' : 'expiring'}: ${row.domain}`,
        message: `${row.domain} has ${days} day(s) remaining.`,
        entityType: 'domain',
        entityId: row._id,
        dedupeMinutes: 1440,
      });
    }
    await queueClientExpiryNotice(row);
    if (prev !== row.status) {
      await writeInfraLog({
        tenantId,
        category: 'event',
        level: 'info',
        message: `Domain ${row.domain} status → ${row.status}`,
      });
    }
  }
};

/** Internal alert only. Client email waits for an admin approve action. */
export const queueClientExpiryNotice = async (row) => {
  const email = String(row.clientEmail || '').trim();
  if (!email || row.clientMailStatus === 'sent' || row.clientMailStatus === 'pending') return;
  const days = daysUntil(row.expiryDate || row.renewalDate);
  if (days == null || days > 5) return;
  row.clientMailStatus = 'pending';
  await row.save();
  await raiseAlert({
    tenantId: row.tenantId,
    type: 'domain_expiring',
    severity: days < 0 ? 'critical' : 'warning',
    title: `Approve renewal email: ${row.domain}`,
    message: `${row.clientName || 'Client'} (${email}) has ${days} day(s) left. Approve to send the email.`,
    entityType: 'domain',
    entityId: row._id,
    dedupeMinutes: 24 * 60,
  });
};

export const queueClientExpiryNotices = async (tenantId) => {
  const rows = await InfraDomain.find({
    tenantId,
    clientEmail: { $nin: ['', null] },
    clientMailStatus: 'none',
  }).limit(200);
  for (const row of rows) {
    await queueClientExpiryNotice(row);
  }
};

export const refreshSslStatuses = async (tenantId) => {
  const rows = await InfraSsl.find({ tenantId }).limit(500);
  for (const row of rows) {
    const host = String(row.domain || '').replace(/^https?:\/\//, '').split('/')[0];
    try {
      const live = await fetchLiveSslCertificate(host, 443);
      if (live?.expiryDate) {
        row.expiryDate = live.expiryDate;
        if (live.issuedDate) row.issuedDate = live.issuedDate;
        if (live.issuer) row.provider = row.provider || live.issuer.slice(0, 120);
        row.notes = row.notes || '';
      }
    } catch (err) {
      await writeInfraLog({
        tenantId,
        category: 'error',
        level: 'warn',
        message: `Live SSL check failed for ${row.domain}: ${err.message}`,
      });
    }

    row.status = sslStatusFromExpiry(row.expiryDate);
    row.lastCheckedAt = new Date();
    await row.save();

    const days = daysUntil(row.expiryDate);
    if (row.status === 'expired' || (days != null && days <= 7)) {
      await raiseAlert({
        tenantId,
        type: 'ssl_expiring',
        severity: row.status === 'expired' || days < 0 ? 'critical' : 'warning',
        title: `SSL ${row.status === 'expired' ? 'expired' : 'expiring'}: ${row.domain}`,
        message: `${row.domain} certificate has ${days} day(s) remaining.`,
        entityType: 'ssl',
        entityId: row._id,
        dedupeMinutes: 1440,
      });
    } else if (days != null && days <= 30) {
      await raiseAlert({
        tenantId,
        type: 'ssl_expiring',
        severity: 'warning',
        title: `SSL expiring soon: ${row.domain}`,
        message: `${row.domain} certificate has ${days} day(s) remaining.`,
        entityType: 'ssl',
        entityId: row._id,
        dedupeMinutes: 1440,
      });
    }
  }
};
