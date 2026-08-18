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
  fetchGlobalLeaderboard: () => request('/metrics/global-leaderboard'),
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
  deployTicketPanel: (guildId, payload) =>
    request(`/guilds/${guildId}/tickets/deploy-panel`, {
      method: 'POST',
      body: JSON.stringify(payload),
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
  uploadPluginBanner: (guildId, id, file) => {
    const form = new FormData();
    form.append('banner', file);
    return fetch(`${API}/guilds/${guildId}/plugins/${id}/banner`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    }).then((r) => r.json());
  },
  testWebhook: (payload) =>
    request('/webhooks/test', { method: 'POST', body: JSON.stringify(payload) }),
  fetchLeaderboard: (guildId) =>
    request(`/guilds/${guildId}/leveling/leaderboard`),
  fetchScheduledAnnouncements: (guildId) =>
    request(`/guilds/${guildId}/announcements/scheduled`),
  createScheduledAnnouncement: (guildId, payload) =>
    request(`/guilds/${guildId}/announcements/schedule`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteScheduledAnnouncement: (guildId, id) =>
    request(`/guilds/${guildId}/announcements/schedule/${id}`, { method: 'DELETE' }),
  deployRolesPanel: (guildId, payload) =>
    request(`/guilds/${guildId}/roles/panels`, { method: 'POST', body: JSON.stringify(payload) }),
  fetchNexusTickets: () =>
    request('/nexus/tickets'),
  fetchBlacklist: () =>
    request('/blacklist/federation'),
  addBlacklist: (payload) =>
    request('/blacklist/federation', { method: 'POST', body: JSON.stringify(payload) }),
  deleteBlacklist: (userId) =>
    request(`/blacklist/federation/${userId}`, { method: 'DELETE' }),
  fetchForms: (guildId) =>
    request(`/guilds/${guildId}/forms`),
  saveForm: (guildId, payload) =>
    request(`/guilds/${guildId}/forms`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteForm: (guildId, formId) =>
    request(`/guilds/${guildId}/forms/${formId}`, { method: 'DELETE' }),
  fetchWelcomeCard: (guildId) =>
    request(`/guilds/${guildId}/welcome-card`),
  saveWelcomeCard: (guildId, payload) =>
    request(`/guilds/${guildId}/welcome-card`, { method: 'POST', body: JSON.stringify(payload) }),
  fetchExclusions: (guildId) =>
    request(`/guilds/${guildId}/roles/exclusions`),
  addExclusion: (guildId, payload) =>
    request(`/guilds/${guildId}/roles/exclusions`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteExclusion: (guildId, id) =>
    request(`/guilds/${guildId}/roles/exclusions/${id}`, { method: 'DELETE' }),
  fetchInviteStats: (guildId) =>
    request(`/guilds/${guildId}/invites/stats`),
  fetchBlindbox: (guildId) =>
    request(`/guilds/${guildId}/economy/blindbox`),
  saveBlindbox: (guildId, payload) =>
    request(`/guilds/${guildId}/economy/blindbox`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteBlindbox: (guildId, prizeId) =>
    request(`/guilds/${guildId}/economy/blindbox/${prizeId}`, { method: 'DELETE' }),
  fetchPredictions: (guildId) =>
    request(`/guilds/${guildId}/economy/predictions`),
  createPrediction: (guildId, payload) =>
    request(`/guilds/${guildId}/economy/predictions`, { method: 'POST', body: JSON.stringify(payload) }),
  resolvePrediction: (guildId, id, payload) =>
    request(`/guilds/${guildId}/economy/predictions/${id}/resolve`, { method: 'POST', body: JSON.stringify(payload) }),
  roles: (guildId) =>
    request(`/guilds/${guildId}/roles`),
  submitFeedback: (payload) =>
    request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
};
