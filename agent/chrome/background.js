let since = Date.now();
let last = { url: '', title: '' };

async function settings() {
  return chrome.storage.local.get({ api: 'http://localhost:5000', token: '' });
}

async function send(url, title, elapsed) {
  const { api, token } = await settings();
  if (!token || !url) return;
  let host = '';
  try { host = new URL(url).hostname; } catch { return; }
  if (!host || host === 'newtab' || url.startsWith('chrome')) return;
  await fetch(`${api.replace(/\/$/, '')}/api/wfh/agent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ elapsed, url, window: title, app: 'chrome', status: 'working' }),
  });
}

async function flush(nextUrl, nextTitle) {
  const elapsed = Math.max(1, Math.round((Date.now() - since) / 1000));
  const prev = last;
  since = Date.now();
  last = { url: nextUrl || '', title: nextTitle || '' };
  if (prev.url && elapsed >= 2) await send(prev.url, prev.title, Math.min(elapsed, 60));
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await flush(tab.url, tab.title);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.active || !info.url) return;
  await flush(tab.url, tab.title);
});
