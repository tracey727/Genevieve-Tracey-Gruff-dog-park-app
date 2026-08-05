'use strict';

import { requirePool } from './_lib/db.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({
      status: 'error',
      message: 'Method not allowed.'
    });
  }

  const started = Date.now();

  try {
    const result = await requirePool().query(
      'SELECT NOW() AS db_time, 1 AS active'
    );

    return response.status(200).json({
      status: 'ok',
      database: 'connected',
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
      dbTimestamp: result.rows[0].db_time
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'database_health_check_failed',
      message: error?.message || 'Unknown database error'
    }));

    return response.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: 'Database health check failed.',
      timestamp: new Date().toISOString()
    });
  }
}
