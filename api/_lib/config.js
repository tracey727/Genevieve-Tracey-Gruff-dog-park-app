'use strict';

const REQUIRED_PRODUCTION_KEYS = [
  'SESSION_PEPPER',
  'FIELD_ENCRYPTION_KEY',
  'AUDIT_HMAC_KEY',
  'APP_ORIGIN',
  'CRON_SECRET'
];

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) throw new Error(`Missing required environment variable: ${name}`);
  return String(value).trim();
}

function parseOrigins(value) {
  const origins = String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => new URL(item).origin);
  if (!origins.length) throw new Error('APP_ORIGIN must contain at least one exact origin.');
  if (process.env.NODE_ENV === 'production' && origins.some(origin => !origin.startsWith('https://'))) {
    throw new Error('Every production APP_ORIGIN must use HTTPS.');
  }
  return Object.freeze([...new Set(origins)]);
}

function parseBoolean(value, fallback) {
  if (value == null || value === '') return fallback;
  if (/^(1|true|yes)$/i.test(String(value))) return true;
  if (/^(0|false|no)$/i.test(String(value))) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseInteger(name, fallback, minimum, maximum) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

function decodeBase64Secret(name, { exactBytes = null, minimumBytes = 32, developmentFallback = null } = {}) {
  const raw = process.env[name];
  if (!raw && developmentFallback != null && process.env.NODE_ENV !== 'production') {
    return Buffer.from(developmentFallback, 'utf8');
  }
  const value = requireEnvironment(name);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error(`${name} must be standard base64.`);
  }
  const secret = Buffer.from(value, 'base64');
  if (exactBytes !== null && secret.length !== exactBytes) {
    throw new Error(`${name} must decode to exactly ${exactBytes} bytes.`);
  }
  if (exactBytes === null && secret.length < minimumBytes) {
    throw new Error(`${name} must decode to at least ${minimumBytes} bytes.`);
  }
  return secret;
}

function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!String(process.env.DATABASE_RUNTIME_URL || process.env.DATABASE_URL || '').trim()) {
    throw new Error('Missing required environment variable: DATABASE_RUNTIME_URL or DATABASE_URL');
  }
  for (const name of REQUIRED_PRODUCTION_KEYS) requireEnvironment(name);
}

validateProductionEnvironment();

const secureCookies = parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production');
if (process.env.NODE_ENV === 'production' && !secureCookies) throw new Error('COOKIE_SECURE must be true in production.');

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  buildId: process.env.BUILD_ID || '2026.08.05.52-backend-140-152',
  databaseUrl: process.env.DATABASE_RUNTIME_URL || process.env.DATABASE_URL || '',
  databaseSslCa: process.env.DATABASE_SSL_CA_BASE64 ? Buffer.from(process.env.DATABASE_SSL_CA_BASE64, 'base64').toString('utf8') : '',
  appOrigins: parseOrigins(process.env.APP_ORIGIN || 'http://localhost:3000'),
  sessionPepper: decodeBase64Secret('SESSION_PEPPER', { developmentFallback: 'development-only-session-pepper-change-me-32-bytes' }),
  fieldEncryptionKey: decodeBase64Secret('FIELD_ENCRYPTION_KEY', { exactBytes: 32, developmentFallback: '00000000000000000000000000000000' }),
  auditHmacKey: decodeBase64Secret('AUDIT_HMAC_KEY', { developmentFallback: 'development-only-audit-key-change-me-32-bytes' }),
  cookieSecure: secureCookies,
  sessionCookieName: secureCookies ? '__Host-genevieve_session' : 'genevieve_session',
  csrfCookieName: secureCookies ? '__Host-genevieve_csrf' : 'genevieve_csrf',
  sessionAbsoluteSeconds: parseInteger('SESSION_ABSOLUTE_SECONDS', 604800, 3600, 2592000),
  sessionIdleSeconds: parseInteger('SESSION_IDLE_SECONDS', 43200, 900, 604800),
  maxJsonBytes: parseInteger('MAX_JSON_BYTES', 524288, 1024, 1048576),
  maxStateBytes: parseInteger('MAX_STATE_BYTES', 524288, 1024, 1048576),
  databasePoolMax: parseInteger('DATABASE_POOL_MAX', 3, 1, 20),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, true),
  cronSecret: process.env.CRON_SECRET || ''
});

if (config.sessionIdleSeconds > config.sessionAbsoluteSeconds) {
  throw new Error('SESSION_IDLE_SECONDS cannot exceed SESSION_ABSOLUTE_SECONDS.');
}
