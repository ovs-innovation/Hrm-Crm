import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const SALT = 'vastora-infra-v1';

const getKey = () => {
  const secret = process.env.INFRA_CREDENTIALS_KEY || process.env.JWT_SECRET || 'infra-dev-key';
  return crypto.scryptSync(String(secret), SALT, 32);
};

/** Encrypt sensitive credentials before storage. Returns opaque string. */
export const encryptSecret = (plain) => {
  if (plain == null || plain === '') return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
};

export const decryptSecret = (payload) => {
  if (!payload || typeof payload !== 'string') return '';
  if (!payload.startsWith('v1:')) return '';
  const [, ivB64, tagB64, dataB64] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
};

export const maskSecret = (value) => {
  if (!value) return '';
  const s = String(value);
  if (s.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(12, s.length - 4))}${s.slice(-4)}`;
};
