const API = '/api';

/** 未授權（未登入或 session 過期）——由呼叫端決定如何處理，不再強制整頁跳轉 */
export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  me: () => request('/oauth/me'),
  login: () => {
    window.location.href = `${API}/oauth/login`;
  },
  logout: () => {
    window.location.href = `${API}/oauth/logout`;
  },
  guilds: () => request('/oauth/guilds'),
  invite: () => request('/oauth/invite'),
  globalMetrics: () => request('/metrics/global'),
  guild: (id) => request(`/guilds/${id}`),
  saveSettings: (id, patch) =>
    request(`/guilds/${id}/settings`, { method: 'PUT', body: JSON.stringify(patch) }),
  tickets: (id, status = 'all') => request(`/guilds/${id}/tickets?status=${status}`),
  channels: (id) => request(`/guilds/${id}/channels`),
  sendEmbed: (id, payload) =>
    request(`/guilds/${id}/embed`, { method: 'POST', body: JSON.stringify(payload) }),
  batchTickets: (id, ids, action, by) =>
    request(`/guilds/${id}/tickets/batch`, {
      method: 'POST',
      body: JSON.stringify({ ids, action, by }),
    }),
  plugins: (id) => request(`/guilds/${id}/plugins`),
  updatePluginStatus: (guildId, id, status) =>
    request(`/guilds/${guildId}/plugins/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  marketplaceList: () => request('/plugins/marketplace/list'),
  installMarketplacePlugin: (guildId, pluginId) =>
    request(`/guilds/${guildId}/plugins/marketplace/install`, {
      method: 'POST',
      body: JSON.stringify({ pluginId }),
    }),
  uploadPlugin: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API}/guilds/${id}/plugins/upload`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    }).then((r) => r.json());
  },
  testWebhook: (payload) =>
    request('/webhooks/test', { method: 'POST', body: JSON.stringify(payload) }),
};
