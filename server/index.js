import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import config from './config.js';
import { pingDb } from './db.js';
import { migrate } from './migrate.js';
import AuthController, { requireAuth } from './controllers/AuthController.js';
import PlayerController from './controllers/PlayerController.js';
import DiscordAuthService from './auth/DiscordAuthService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);

const discordAuth = new DiscordAuthService();
if (!discordAuth.isConfigured()) {
  console.warn('[auth] Discord OAuth NÃO configurado (DISCORD_* + SESSION_SECRET).');
}

app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '64kb' }));

app.get('/health', async (_req, res) => {
  let db = false;
  let dbError = null;
  try {
    db = await pingDb();
  } catch (err) {
    dbError = err.message;
  }
  res.status(200).json({
    ok: true,
    db,
    dbError,
    env: config.nodeEnv,
    authConfigured: discordAuth.isConfigured(),
  });
});

app.get('/ready', async (_req, res) => {
  try {
    const dbOk = await pingDb();
    if (!dbOk) return res.status(503).json({ ok: false, db: false });
    res.json({ ok: true, db: true });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err.message });
  }
});

app.get('/auth/status', AuthController.status);
app.get('/auth/discord/login', AuthController.login);
app.get('/auth/discord/callback', AuthController.callback);
app.post('/auth/logout', AuthController.logout);

app.get('/api/meta', PlayerController.meta);
app.get('/api/player/me', requireAuth, PlayerController.me);
app.post('/api/player/character', requireAuth, PlayerController.ensureCharacter);
app.post('/api/player/run-end', requireAuth, PlayerController.endRun);
app.post('/api/player/upgrades/buy', requireAuth, PlayerController.buyUpgrade);
app.post('/api/player/equipment/buy', requireAuth, PlayerController.buyEquipment);
app.post('/api/player/skills/upgrade', requireAuth, PlayerController.buySkill);
app.put('/api/player/settings', requireAuth, PlayerController.saveSettings);

const clientDist = path.resolve(__dirname, '../client/dist');
if (config.nodeEnv === 'production') {
  app.use(express.static(clientDist, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api')
      || req.path.startsWith('/auth')
      || req.path === '/health'
      || req.path === '/ready'
    ) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno',
  });
});

async function start() {
  try {
    await migrate();
  } catch (err) {
    console.error('[dungeon] migrate falhou:', err.message);
    console.error('[dungeon] confira DB_HOST/DB_USER/DB_PASSWORD/DB_NAME no Portainer');
  }

  app.listen(config.port, () => {
    console.log(`[dungeon] listening on :${config.port} env=${config.nodeEnv} db=${config.db.database}`);
  });
}

start();
