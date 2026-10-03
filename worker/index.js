import bom from '../api/bom.js';
import checkout from '../api/create-checkout-session.js';
import portal from '../api/create-portal-session.js';
import membership from '../api/membership-status.js';
import stripeWebhook from '../api/stripe-webhook.js';
import tripCalculate from '../api/trip-calculate.js';

const ROUTES = new Map([
  ['/api/bom', bom],
  ['/api/create-checkout-session', checkout],
  ['/api/create-portal-session', portal],
  ['/api/membership-status', membership],
  ['/api/stripe-webhook', stripeWebhook],
  ['/api/trip-calculate', tripCalculate]
]);

function headersObject(request) {
  const values = {};
  for (const [key, value] of request.headers.entries()) values[key.toLowerCase()] = value;
  const url = new URL(request.url);
  values.host ||= url.host;
  values['x-forwarded-host'] ||= url.host;
  values['x-forwarded-proto'] ||= url.protocol.replace(':', '');
  return values;
}

async function requestBody(request, pathname) {
  if (request.method === 'GET' || request.method === 'HEAD') return { raw: new Uint8Array(), parsed: undefined };
  const raw = new Uint8Array(await request.arrayBuffer());
  if (pathname === '/api/stripe-webhook') return { raw, parsed: undefined };
  if (!raw.byteLength) return { raw, parsed: {} };
  const text = new TextDecoder().decode(raw);
  try { return { raw, parsed: JSON.parse(text) }; }
  catch { return { raw, parsed: text }; }
}

function makeRequestAdapter(request, url, raw, parsed) {
  const bodyBuffer = Buffer.from(raw);
  return {
    method: request.method,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: headersObject(request),
    body: parsed,
    async *[Symbol.asyncIterator]() {
      if (bodyBuffer.length) yield bodyBuffer;
    }
  };
}

function makeResponseAdapter() {
  let statusCode = 200;
  const headers = new Headers();
  let body = null;
  const res = {
    setHeader(name, value) { headers.set(name, String(value)); return res; },
    status(code) { statusCode = Number(code) || 500; return res; },
    json(value) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
      body = JSON.stringify(value);
      return res;
    },
    send(value) {
      body = typeof value === 'string' || value instanceof Uint8Array ? value : JSON.stringify(value);
      return res;
    }
  };
  return { res, response: () => new Response(body, { status: statusCode, headers }) };
}

export async function invokeLegacyHandler(handler, request) {
  const url = new URL(request.url);
  const { raw, parsed } = await requestBody(request.clone(), url.pathname);
  const req = makeRequestAdapter(request, url, raw, parsed);
  const { res, response } = makeResponseAdapter();
  await handler(req, res);
  return response();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        product: 'GENEVIEVE Dog Park',
        runtime: 'cloudflare-workers',
        data: 'neon',
        version: '53'
      });
    }

    const handler = ROUTES.get(url.pathname);
    if (handler) return invokeLegacyHandler(handler, request);

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  }
};
