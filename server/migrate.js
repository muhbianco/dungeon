import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import config from './config.js';
import { resetPool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function assertSafeDbName(name) {
  if (!name || !/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`DB_NAME inválido: ${name}`);
  }
  return name;
}

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((chunk) => chunk
      .split('\n')
      .filter((line) => !/^\s*--/.test(line))
      .join('\n')
      .trim())
    .filter(Boolean);
}

/**
 * Cria o database (se não existir) e aplica as tabelas do schema.sql.
 * Conecta sem database selecionado para poder executar CREATE DATABASE.
 */
export async function migrate() {
  const database = assertSafeDbName(config.db.database);
  const schemaPath = path.resolve(__dirname, '../sql/schema.sql');
  const raw = await fs.readFile(schemaPath, 'utf8');

  // Troca o nome fixo do schema pelo DB_NAME da env.
  const sql = raw
    .replace(/\bCREATE DATABASE IF NOT EXISTS\s+`?dungeon_descent`?/gi, `CREATE DATABASE IF NOT EXISTS \`${database}\``)
    .replace(/\bUSE\s+`?dungeon_descent`?/gi, `USE \`${database}\``);

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: false,
  });

  try {
    const statements = splitStatements(sql);
    for (const statement of statements) {
      await connection.query(statement);
    }

    // Patches idempotentes para bases já existentes
    await connection.query(`USE \`${database}\``);
    await connection.query(
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS google_id VARCHAR(64) NULL AFTER discord_id`
    );
    await connection.query(
      `ALTER TABLE players MODIFY COLUMN avatar VARCHAR(512) NULL`
    );
    try {
      await connection.query(
        `ALTER TABLE players ADD UNIQUE KEY uq_players_google_id (google_id)`
      );
    } catch (err) {
      // índice já existe
      if (!/Duplicate|exists/i.test(err.message || '')) throw err;
    }

    console.log(`[dungeon] migrate ok — database=${database}`);
  } finally {
    await connection.end();
  }

  resetPool();
}
