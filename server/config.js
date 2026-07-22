import dotenv from 'dotenv';

dotenv.config();

const publicUrl = (process.env.PUBLIC_URL || process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  publicUrl,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dungeon_descent',
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    serverId: process.env.DISCORD_SERVER_ID || '',
    redirectUri: `${publicUrl}/auth/discord/callback`,
    scope: 'identify guilds',
    apiBase: 'https://discord.com/api/v10',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${publicUrl}/auth/google/callback`,
    scope: 'openid email profile',
  },
  session: {
    secret: process.env.SESSION_SECRET || '',
    cookieName: 'dd_session',
    stateCookie: 'dd_oauth_state',
    ttlMs: 1000 * 60 * 60 * 24 * 14,
  },
};

export default config;
