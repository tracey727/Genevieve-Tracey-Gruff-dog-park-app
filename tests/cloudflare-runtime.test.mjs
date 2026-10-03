import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('Cloudflare is the canonical runtime and Vercel config is absent', () => {
  const wrangler = read('wrangler.toml');
  const pkg = JSON.parse(read('package.json'));
  assert.match(wrangler, /main = "worker\/index\.js"/);
  assert.match(wrangler, /directory = "\.\/dist"/);
  assert.match(wrangler, /run_worker_first = \["\/api\/\*", "\/health"\]/);
  assert.equal(fs.existsSync('vercel.json'), false);
  assert.match(pkg.scripts['cf:check'], /wrangler deploy --dry-run/);
});

test('Cloudflare worker routes all current server APIs', () => {
  const worker = read('worker/index.js');
  for (const path of [
    '/api/bom',
    '/api/create-checkout-session',
    '/api/create-portal-session',
    '/api/membership-status',
    '/api/stripe-webhook',
    '/api/trip-calculate'
  ]) assert.equal(worker.includes(path), true, path);
  assert.match(worker, /runtime: 'cloudflare-workers'/);
});

test('V53 route source no longer instructs Vercel secret configuration', () => {
  const route = read('api/trip-calculate.js');
  assert.doesNotMatch(route, /in Vercel/i);
  assert.match(route, /OPENROUTESERVICE_API_KEY/);
});
