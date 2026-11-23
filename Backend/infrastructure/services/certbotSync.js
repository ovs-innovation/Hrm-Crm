import InfraSsl from '../models/InfraSsl.js';
import { raiseAlert } from './alertService.js';
import { daysUntil, sslStatusFromExpiry } from './expiryService.js';

const asDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Upsert Let's Encrypt certs reported by the VPS agent into InfraSsl. */
export const syncCertbotCertificates = async (tenantId, certificates = []) => {
  let updated = 0;
  for (const cert of certificates.slice(0, 80)) {
    const domain = String(cert.name || cert.domains?.[0] || '').trim().toLowerCase();
    const expiryDate = asDate(cert.notAfter);
    if (!domain || !expiryDate) continue;
    const status = sslStatusFromExpiry(expiryDate);
    const days = daysUntil(expiryDate);
    await InfraSsl.findOneAndUpdate(
      { tenantId, domain },
      {
        $set: {
          tenantId,
          domain,
          provider: 'letsencrypt',
          issuedDate: asDate(cert.notBefore),
          expiryDate,
          autoRenewal: true,
          status,
          lastCheckedAt: new Date(),
          notes: Array.isArray(cert.domains) ? cert.domains.slice(0, 12).join(', ') : '',
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    updated += 1;
    if (status === 'expired' || (days != null && days <= 14)) {
      await raiseAlert({
        tenantId,
        type: 'ssl_expiring',
        severity: status === 'expired' || days < 0 ? 'critical' : 'warning',
        title: status === 'expired' ? `SSL expired: ${domain}` : `SSL expiring: ${domain}`,
        message: days == null ? domain : `${domain} · ${days} days`,
        entityType: 'ssl',
        entityId: domain,
        dedupeMinutes: 12 * 60,
      });
    }
  }
  return updated;
};
