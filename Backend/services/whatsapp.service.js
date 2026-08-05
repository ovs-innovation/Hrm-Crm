/**
 * WhatsApp Business Cloud API helper.
 * Configure:
 *   WHATSAPP_TOKEN (or WHATSAPP_API_TOKEN)
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_VERIFY_TOKEN (webhook)
 * Optional:
 *   WHATSAPP_API_URL — defaults to Graph API messages endpoint
 */

const normalizePhone = (phone = '') => {
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

export function isWhatsAppConfigured() {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(token && phoneId);
}

export function getWhatsAppStatus() {
  return {
    configured: isWhatsAppConfigured(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    hasToken: Boolean(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN),
  };
}

export async function sendWhatsAppText({ to, body }) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    const err = new Error('WhatsApp is not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.');
    err.code = 'WHATSAPP_NOT_CONFIGURED';
    throw err;
  }

  const toPhone = normalizePhone(to);
  if (!toPhone || toPhone.length < 10) {
    const err = new Error('Invalid WhatsApp phone number');
    err.code = 'INVALID_PHONE';
    throw err;
  }

  const url =
    process.env.WHATSAPP_API_URL ||
    `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { preview_url: false, body: String(body || '').slice(0, 4096) },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `WhatsApp API HTTP ${res.status}`;
    const err = new Error(msg);
    err.code = 'WHATSAPP_API_ERROR';
    err.details = data;
    throw err;
  }

  return {
    externalMessageId: data?.messages?.[0]?.id || '',
    to: toPhone,
    raw: data,
  };
}

export { normalizePhone };
