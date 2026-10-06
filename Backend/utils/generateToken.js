import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 14);

const ACCESS_COOKIE_NAMES = ['admin_jwt', 'jwt'];
const REFRESH_COOKIE_NAMES = ['admin_refreshToken', 'refreshToken'];

const cookieOpts = (maxAgeMs) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd || process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAMESITE || (isProd ? 'lax' : 'lax'),
    path: '/',
    maxAge: maxAgeMs,
  };
};

const authCookieNames = (userType) =>
  userType === 'Employee'
    ? { access: 'jwt', refresh: 'refreshToken' }
    : { access: 'admin_jwt', refresh: 'admin_refreshToken' };

export const readAccessToken = (req) => {
  for (const name of ACCESS_COOKIE_NAMES) {
    if (req.cookies?.[name]) return req.cookies[name];
  }
  return null;
};

export const readRefreshToken = (req) => {
  for (const name of REFRESH_COOKIE_NAMES) {
    if (req.cookies?.[name]) return req.cookies[name];
  }
  return null;
};

const setAuthCookies = (res, { accessToken, refreshRaw, userType }) => {
  const names = authCookieNames(userType);
  res.cookie(names.access, accessToken, cookieOpts(parseDurationMs(ACCESS_TTL, 15 * 60 * 1000)));
  res.cookie(names.refresh, refreshRaw, cookieOpts(REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000));
};

const parseDurationMs = (expiresIn, fallbackMs) => {
  const m = String(expiresIn).match(/^(\d+)([smhd])$/i);
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2].toLowerCase()] || 60_000;
  return n * mult;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const issueAccessToken = (payload) => {
  const { userId, tenantId, userType, tokenVersion = 0 } = payload;
  return jwt.sign(
    { userId, tenantId, userType, tokenVersion, typ: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
};

export const createRefreshSession = async ({
  res,
  userId,
  tenantId,
  userType,
  req,
  familyId = crypto.randomUUID(),
  deviceId,
  deviceLabel,
  tokenVersion = 0,
}) => {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  const resolvedDeviceId = deviceId || req?.headers['x-device-id'] || crypto.randomUUID();

  await RefreshToken.create({
    tenantId,
    userId,
    userType,
    tokenHash,
    familyId,
    deviceId: resolvedDeviceId,
    deviceLabel: deviceLabel || req?.headers['x-device-label'] || 'Web',
    userAgent: req?.headers['user-agent'] || '',
    ip: req?.ip || req?.headers['x-forwarded-for'] || '',
    expiresAt,
  });

  const accessToken = issueAccessToken({
    userId,
    tenantId,
    userType,
    tokenVersion,
  });

  setAuthCookies(res, { accessToken, refreshRaw: raw, userType });

  return { accessToken, refreshToken: raw, familyId, deviceId: resolvedDeviceId };
};

/**
 * Rotate refresh token. Reuse of an already-rotated token revokes the whole family.
 */
export const rotateRefreshToken = async ({ rawRefreshToken, req, res }) => {
  if (!rawRefreshToken) {
    const err = new Error('Refresh token required');
    err.status = 401;
    throw err;
  }

  const tokenHash = hashToken(rawRefreshToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  if (existing.revokedAt) {
    // Token reuse detection — revoke entire family
    await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    const err = new Error('Refresh token reuse detected. All sessions in this family were revoked.');
    err.status = 401;
    throw err;
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    existing.revokedAt = new Date();
    await existing.save();
    const err = new Error('Refresh token expired');
    err.status = 401;
    throw err;
  }

  const newRaw = crypto.randomBytes(48).toString('hex');
  const newHash = hashToken(newRaw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  existing.revokedAt = new Date();
  existing.replacedByHash = newHash;
  await existing.save();

  await RefreshToken.create({
    tenantId: existing.tenantId,
    userId: existing.userId,
    userType: existing.userType,
    tokenHash: newHash,
    familyId: existing.familyId,
    deviceId: existing.deviceId,
    deviceLabel: existing.deviceLabel,
    userAgent: req?.headers['user-agent'] || existing.userAgent,
    ip: req?.ip || existing.ip,
    expiresAt,
  });

  const accessToken = issueAccessToken({
    userId: existing.userId,
    tenantId: existing.tenantId,
    userType: existing.userType,
  });

  setAuthCookies(res, { accessToken, refreshRaw: newRaw, userType: existing.userType });

  return {
    accessToken,
    refreshToken: newRaw,
    userId: existing.userId,
    tenantId: existing.tenantId,
    userType: existing.userType,
    deviceId: existing.deviceId,
  };
};

export const revokeRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

export const revokeAllUserSessions = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const listUserSessions = async (userId) => {
  return RefreshToken.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .select('deviceId deviceLabel userAgent ip createdAt expiresAt familyId')
    .sort({ createdAt: -1 })
    .lean();
};

export const clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure: isProd || process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAMESITE || (isProd ? 'lax' : 'lax'),
    path: '/',
    expires: new Date(0),
  };
  for (const name of [...ACCESS_COOKIE_NAMES, ...REFRESH_COOKIE_NAMES]) {
    res.cookie(name, '', base);
  }
};

/** @deprecated use createRefreshSession — kept for gradual migration call sites */
const generateToken = async (res, userId, extras = {}) => {
  const { tenantId, userType = 'Admin', req } = extras;
  if (!tenantId) {
    // Fallback short-lived access-only (should not happen in RC2 paths)
    const accessToken = jwt.sign({ userId, typ: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
    res.cookie('jwt', accessToken, cookieOpts(parseDurationMs(ACCESS_TTL, 15 * 60 * 1000)));
    return { accessToken };
  }
  return createRefreshSession({ res, userId, tenantId, userType, req });
};

export default generateToken;
