import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { isOriginAllowed } from '../utils/corsUtil.js';

test('CORS Policy & Origin Validation Tests', async (t) => {
  await t.test('isOriginAllowed correctly permits official production and development origins', () => {
    // Live Vercel production frontend
    assert.strictEqual(isOriginAllowed('https://code-together-weld.vercel.app'), true);
    assert.strictEqual(isOriginAllowed('https://code-together-weld.vercel.app/'), true);

    // Vercel preview deployments
    assert.strictEqual(isOriginAllowed('https://code-together-preview.vercel.app'), true);
    assert.strictEqual(isOriginAllowed('https://codetogether.vercel.app'), true);

    // Local development origins
    assert.strictEqual(isOriginAllowed('http://localhost:5173'), true);
    assert.strictEqual(isOriginAllowed('http://127.0.0.1:5173'), true);
    assert.strictEqual(isOriginAllowed('http://localhost:3000'), true);
    assert.strictEqual(isOriginAllowed('http://localhost:5000'), true);

    // Empty or server-to-server requests
    assert.strictEqual(isOriginAllowed(''), true);
    assert.strictEqual(isOriginAllowed(null), true);
    assert.strictEqual(isOriginAllowed(undefined), true);
  });

  await t.test('Express CORS middleware allows Vercel origin preflight and returns proper headers', async () => {
    const app = express();
    app.use(
      cors({
        origin: (origin, callback) => {
          if (isOriginAllowed(origin)) {
            return callback(null, true);
          }
          return callback(null, false);
        },
        credentials: true,
      })
    );
    app.use(express.json());
    app.post('/api/test-preflight', (req, res) => res.json({ ok: true }));

    const server = app.listen(0);
    const port = server.address().port;
    const testUrl = `http://localhost:${port}/api/test-preflight`;

    try {
      const res = await fetch(testUrl, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://code-together-weld.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });

      assert.strictEqual(res.status, 204, 'Preflight OPTIONS must succeed with 204 No Content');
      assert.strictEqual(
        res.headers.get('access-control-allow-origin'),
        'https://code-together-weld.vercel.app',
        'Should allow origin header'
      );
      assert.strictEqual(
        res.headers.get('access-control-allow-credentials'),
        'true',
        'Should permit credentials'
      );
    } finally {
      server.close();
    }
  });
});
