'use strict';

import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;
const ALLOWED_ROLES = new Set(['owner', 'council', 'ranger', 'supervisor', 'admin']);
const PROTECTED_TABLES = [
  'app_users', 'user_sessions', 'user_state', 'checkins', 'idempotency_keys',
  'api_rate_limits', 'audit_events', 'outbox_events', 'deletion_requests'
];

function createPool() {
  if (!config.databaseUrl) return null;
  const local = /localhost|127\.0\.0\.1/.test(config.databaseUrl);
  const ssl = local ? false : {
    rejectUnauthorized: true,
    ...(config.databaseSslCa ? { ca: config.databaseSslCa } : {})
  };
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl,
    max: config.databasePoolMax,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    application_name: `genevieve-dogpark-${config.buildId}`
  });
  pool.on('error', error => {
    console.error(JSON.stringify({ level: 'error', event: 'postgres_pool_error', message: error.message }));
  });
  return pool;
}

const globalKey = Symbol.for('genevieve.postgres.pool');
const safetyKey = Symbol.for('genevieve.postgres.safety');
if (!globalThis[globalKey]) globalThis[globalKey] = createPool();
export const pool = globalThis[globalKey];

export function requirePool() {
  if (!pool) throw new Error('DATABASE_RUNTIME_URL or DATABASE_URL is not configured.');
  return pool;
}

export async function assertRuntimeDatabaseSafety() {
  if (config.nodeEnv !== 'production') return;
  if (!globalThis[safetyKey]) {
    globalThis[safetyKey] = requirePool().query(
      `SELECT r.rolsuper, r.rolbypassrls,
              EXISTS (
                SELECT 1
                  FROM pg_class c
                  JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public'
                   AND c.relname = ANY($1::text[])
                   AND pg_get_userbyid(c.relowner) = current_user
              ) AS owns_protected_table
         FROM pg_roles r
        WHERE r.rolname = current_user`,
      [PROTECTED_TABLES]
    ).then(result => {
      const row = result.rows[0];
      if (!row || row.rolsuper || row.rolbypassrls || row.owns_protected_table) {
        throw new Error('Unsafe runtime database role: use a non-owner, non-superuser role without BYPASSRLS.');
      }
      return true;
    }).catch(error => {
      delete globalThis[safetyKey];
      throw error;
    });
  }
  await globalThis[safetyKey];
}

export async function withTransaction(callback, options = {}) {
  const client = await requirePool().connect();
  try {
    await client.query('BEGIN');
    if (options.isolationLevel) {
      const allowed = new Set(['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']);
      if (!allowed.has(options.isolationLevel)) throw new Error('Invalid transaction isolation level.');
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function setUserContext(client, userId, role = 'owner') {
  const safeRole = String(role);
  if (!ALLOWED_ROLES.has(safeRole)) throw new Error('Invalid database role context.');
  await client.query(
    "SELECT set_config('app.user_id', $1, true), set_config('app.role', $2, true)",
    [String(userId), safeRole]
  );
}
