async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  authStatus: () => request('/auth/status'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/api/player/me'),
  meta: () => request('/api/meta'),
  ranking: () => request('/api/ranking'),
  ensureCharacter: (classId) =>
    request('/api/player/character', { method: 'POST', body: { classId } }),
  endRun: (payload) =>
    request('/api/player/run-end', { method: 'POST', body: payload }),
  buyUpgrade: (upgradeKey) =>
    request('/api/player/upgrades/buy', {
      method: 'POST',
      body: { upgradeKey },
    }),
  buyEquipment: (classId, slot) =>
    request('/api/player/equipment/buy', {
      method: 'POST',
      body: { classId, slot },
    }),
  buySkill: (classId, skillKey) =>
    request('/api/player/skills/upgrade', {
      method: 'POST',
      body: { classId, skillKey },
    }),
  saveSettings: (settings) =>
    request('/api/player/settings', {
      method: 'PUT',
      body: { settings },
    }),
};
