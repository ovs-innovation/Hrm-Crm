import { sendEmail } from '../../utils/emailService.js';
import { getOrCreateSettings } from './settingsService.js';

/**
 * Fan-out infra alerts to configured channels.
 * Email uses existing emailService. Other channels are best-effort HTTP webhooks.
 */
export const notifyInfraChannels = async (tenantId, alert) => {
  const settings = await getOrCreateSettings(tenantId);
  const channels = settings.notifications || {};
  const subject = `[Infra ${String(alert.severity || 'warning').toUpperCase()}] ${alert.title}`;
  const text = `${alert.title}\n\n${alert.message || ''}\n\nType: ${alert.type}`;

  const jobs = [];

  if (channels.email?.enabled && channels.email?.target) {
    jobs.push(
      sendEmail({
        to: channels.email.target,
        subject,
        text,
        html: `<p><strong>${alert.title}</strong></p><p>${alert.message || ''}</p><p>Severity: ${alert.severity}</p>`,
      }).catch((e) => console.error('[infra:notify:email]', e.message))
    );
  }

  const postWebhook = async (url, payload) => {
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  };

  if (channels.webhook?.enabled && channels.webhook?.target) {
    jobs.push(
      postWebhook(channels.webhook.target, { source: 'vastora-infra', alert }).catch((e) =>
        console.error('[infra:notify:webhook]', e.message)
      )
    );
  }

  if (channels.slack?.enabled && channels.slack?.target) {
    jobs.push(
      postWebhook(channels.slack.target, { text: subject }).catch((e) =>
        console.error('[infra:notify:slack]', e.message)
      )
    );
  }

  if (channels.telegram?.enabled && channels.telegram?.target) {
    // target format: botToken:chatId
    const [botToken, chatId] = String(channels.telegram.target).split(':');
    if (botToken && chatId) {
      jobs.push(
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: `${subject}\n${alert.message || ''}` }),
          signal: AbortSignal.timeout(10000),
        }).catch((e) => console.error('[infra:notify:telegram]', e.message))
      );
    }
  }

  // WhatsApp: reuse env WhatsApp Cloud API if configured + target phone in settings
  if (channels.whatsapp?.enabled && channels.whatsapp?.target && process.env.WHATSAPP_TOKEN) {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (phoneId) {
      jobs.push(
        fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: String(channels.whatsapp.target).replace(/\D/g, ''),
            type: 'text',
            text: { body: `${subject}\n${alert.message || ''}`.slice(0, 1000) },
          }),
          signal: AbortSignal.timeout(10000),
        }).catch((e) => console.error('[infra:notify:whatsapp]', e.message))
      );
    }
  }

  await Promise.allSettled(jobs);
};
