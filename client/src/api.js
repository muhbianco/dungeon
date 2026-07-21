const PLAYER_KEY = 'dd_player_key';

export function getStoredPlayerKey() {
  return localStorage.getItem(PLAYER_KEY);
}

export function storePlayerKey(key) {
  localStorage.setItem(PLAYER_KEY, key);
}

async function request(path, { method = 'GET', body, playerKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (playerKey) headers['x-player-key'] = playerKey;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  bootstrap: (playerKey, displayName) =>
    request('/api/player/bootstrap', {
      method: 'POST',
      body: { playerKey, displayName },
    }),
  me: (playerKey) => request('/api/player/me', { playerKey }),
  meta: () => request('/api/meta'),
  endRun: (playerKey, payload) =>
    request('/api/player/run-end', { method: 'POST', body: payload, playerKey }),
  buyUpgrade: (playerKey, upgradeKey) =>
    request('/api/player/upgrades/buy', {
      method: 'POST',
      body: { upgradeKey },
      playerKey,
    }),
  saveSettings: (playerKey, settings) =>
    request('/api/player/settings', {
      method: 'PUT',
      body: { settings },
      playerKey,
    }),
};
