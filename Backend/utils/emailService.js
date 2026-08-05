import nodemailer from 'nodemailer';

let transporter = null;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.MAIL_FROM || 'Vastora CRM <noreply@vastora.tech>';
  const payload = { from, to, subject, html, text: text || html?.replace(/<[^>]+>/g, '') };

  const tx = getTransporter();
  if (!tx) {
    console.log('[email:dev]', { to, subject, preview: (text || html || '').slice(0, 120) });
    return { dev: true };
  }
  return tx.sendMail(payload);
};

export const inviteEmailHtml = (name, link) => `
  <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto">
    <h2 style="color:#2E6DB4">Welcome to Vastora</h2>
    <p>Hi ${escapeHtml(name) || 'there'},</p>
    <p>Your employee account is ready. Set your password to access the portal:</p>
    <p><a href="${escapeHtml(link)}" style="background:#2E6DB4;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block">Set Password</a></p>
    <p style="color:#666;font-size:13px">Link expires in 72 hours.</p>
  </div>`;

export const leaveStatusEmailHtml = (name, status, dates) => `
  <div style="font-family:Inter,sans-serif">
    <h2 style="color:#2E6DB4">Leave ${escapeHtml(status)}</h2>
    <p>Hi ${escapeHtml(name)}, your leave request (${escapeHtml(dates)}) has been <strong>${escapeHtml(String(status).toLowerCase())}</strong>.</p>
  </div>`;

export const dealStageEmailHtml = (title, stage, owner) => `
  <div style="font-family:Inter,sans-serif">
    <h2 style="color:#2E6DB4">Deal updated</h2>
    <p><strong>${escapeHtml(title)}</strong> moved to <strong>${escapeHtml(stage)}</strong>.</p>
    ${owner ? `<p>Owner: ${escapeHtml(owner)}</p>` : ''}
  </div>`;
