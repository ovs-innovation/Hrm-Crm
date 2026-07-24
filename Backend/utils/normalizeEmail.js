export const normalizeEmail = (email = '') => email.toLowerCase().trim();

export const emailFilter = (email) => {
  const normalized = normalizeEmail(email);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { email: { $regex: new RegExp(`^${escaped}$`, 'i') } };
};
