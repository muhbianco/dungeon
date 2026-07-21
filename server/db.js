import mysql from 'mysql2/promise';
import config from './config.js';

let pool = null;

export function resetPool() {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }
  return pool;
}

export async function query(sql, params = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function pingDb() {
  const rows = await query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}
