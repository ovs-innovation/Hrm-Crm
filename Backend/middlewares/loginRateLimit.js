import rateLimit from 'express-rate-limit';

// Counts wrong passwords for one email only. A correct sign-in does not count,
// and one office IP cannot lock every other employee out of login.
export const loginAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email || 'missing-email';
  },
  message: {
    message: 'Too many failed sign-in attempts for this email. Wait 15 minutes and try again.',
  },
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many account creation attempts. Try again in an hour.' },
});
