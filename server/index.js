import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import config from './config.js';
import { pingDb } from './db.js';
import { migrate } from './migrate.js';
import PlayerController from './controllers/PlayerController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

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
  // Liveness: processo no ar. DB pode falhar sem derrubar o container.
  res.status(200).json({
    ok: true,
    db,
    dbError,
    env: config.nodeEnv,
  });
});

app.get('/ready', async (_req, res) => {
  try {
    const dbOk = await pingDb();
    if (!dbOk) {
      return res.status(503).json({ ok: false, db: false });
    }
    res.json({ ok: true, db: true });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err.message });
  }
});

app.get('/api/meta', PlayerController.meta);
app.post('/api/player/bootstrap', PlayerController.bootstrap);
app.get('/api/player/me', PlayerController.me);
app.post('/api/player/run-end', PlayerController.endRun);
app.post('/api/player/upgrades/buy', PlayerController.buyUpgrade);
app.put('/api/player/settings', PlayerController.saveSettings);

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
    if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/ready') return next();
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
