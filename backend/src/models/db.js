import Database from 'better-sqlite3';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USE_POSTGRES = !!process.env.DATABASE_URL;

// ── PostgreSQL ────────────────────────────────────────────────────────────────
let pgPool = null;

if (USE_POSTGRES) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pgPool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  // Initialize PostgreSQL schema
  const schemaPath = join(__dirname, 'schema.sql');
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8');
    // Convert SQLite-specific syntax to PostgreSQL
    const pgSchema = schema
      .replace(/TEXT PRIMARY KEY/g, 'TEXT PRIMARY KEY')
      .replace(/INTEGER DEFAULT 0/g, 'INTEGER DEFAULT 0')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMPTZ DEFAULT NOW()')
      .replace(/DATETIME/g, 'TIMESTAMPTZ')
      .replace(/REAL/g, 'DOUBLE PRECISION')
      .replace(/CREATE TRIGGER[\s\S]*?END;/g, '') // skip SQLite triggers
      .replace(/--[^\n]*/g, ''); // strip comments to avoid parse issues

    pgPool.query(pgSchema).catch(err => {
      // Ignore "already exists" errors during init
      if (!err.message.includes('already exists')) {
        console.error('Schema init error:', err.message);
      }
    });

    // pgvector: extension + vector column + HNSW index (runs after schema is ready)
    setTimeout(() => {
      pgPool.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
        ALTER TABLE vector_chunks ADD COLUMN IF NOT EXISTS vector_embedding vector(768);
        CREATE INDEX IF NOT EXISTS idx_vector_chunks_hnsw
          ON vector_chunks USING hnsw (vector_embedding vector_cosine_ops)
          WITH (m = 16, ef_construction = 64);
      `).then(() => {
        console.log('✓ pgvector extension and HNSW index ready');
      }).catch(err => {
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.warn('pgvector setup note:', err.message);
        }
      });
    }, 500);
  }

  console.log('✓ Using PostgreSQL');
}

// ── SQLite ────────────────────────────────────────────────────────────────────
let sqliteDb = null;

if (!USE_POSTGRES) {
  const dataDir = join(__dirname, '../../data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const dbPath = process.env.DATABASE_PATH || join(dataDir, 'meetingmind.db');
  sqliteDb = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  });
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  // Run schema
  const schemaPath = join(__dirname, 'schema.sql');
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8');
    sqliteDb.exec(schema);
  }

  console.log('✓ Using SQLite (set DATABASE_URL to switch to PostgreSQL)');
}

// ── Unified query helper ──────────────────────────────────────────────────────

function generateId() {
  return crypto.randomUUID();
}

export async function query(sql, params = []) {
  if (USE_POSTGRES) {
    // PostgreSQL — native $1/$2 syntax, no conversion needed
    const result = await pgPool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  // SQLite — convert $1/$2 → ?, strip RETURNING, generate UUIDs for DEFAULT
  try {
    let convertedSql = sql;
    let convertedParams = [...params];
    let isReturning = false;

    if (convertedSql.toUpperCase().includes('RETURNING')) {
      isReturning = true;
      convertedSql = convertedSql.replace(/RETURNING\s+\*/gi, '');
    }

    // Convert $N placeholders → ? (replace largest N first to avoid partial replacement)
    if (convertedParams.length > 0) {
      for (let i = convertedParams.length; i >= 1; i--) {
        convertedSql = convertedSql.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
      }
    }

    const isInsert = convertedSql.trim().toUpperCase().startsWith('INSERT');
    if (isInsert && convertedSql.toLowerCase().includes('default')) {
      convertedSql = convertedSql.replace(/DEFAULT/gi, '?');
      convertedParams = [generateId(), ...convertedParams];
    }

    const isSelect = convertedSql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      const stmt = sqliteDb.prepare(convertedSql);
      const rows = stmt.all(...convertedParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = sqliteDb.prepare(convertedSql);
      const info = stmt.run(...convertedParams);

      if (isReturning || isInsert) {
        const match = sql.match(/INTO\s+(\w+)/i);
        if (match && info.lastInsertRowid) {
          const tableName = match[1];
          const lastRow = sqliteDb.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`).get(info.lastInsertRowid);
          return { rows: lastRow ? [lastRow] : [], rowCount: lastRow ? 1 : 0 };
        }
      }

      return { rows: [], rowCount: info.changes, lastID: info.lastInsertRowid };
    }
  } catch (error) {
    console.error('SQLite query error:', error.message);
    console.error('SQL:', sql);
    throw error;
  }
}

export const transaction = async (callback) => {
  if (USE_POSTGRES) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const runTransaction = sqliteDb.transaction(callback);
    return runTransaction();
  }
};

export default sqliteDb || { prepare: () => { throw new Error('Use query() when PostgreSQL is active'); } };
