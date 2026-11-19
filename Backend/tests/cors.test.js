import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';

// Replicate the exact CORS configuration from Backend/index.js
function buildCorsApp(customEnvCorsOrigin) {
  const app = express();

  const allowedOrigins = (customEnvCorsOrigin || process.env.CORS_ORIGIN || 'https://hrm.vastoratech.com,https://hrmadmin.vastoratech.com,https://apnadigitalindia.com,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      let originHost = '';
      try {
        originHost = new URL(origin).hostname;
      } catch {
        originHost = origin;
      }

      const isLoopback = originHost === 'localhost' || originHost === '127.0.0.1';
      const isPrivateLan = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(originHost);
      const localHost = isLoopback || (process.env.NODE_ENV !== 'production' && isPrivateLan);
      const isAllowed = allowedOrigins.includes(origin) || localHost;

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin "${origin}" not allowed.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-tenant-id', 'Accept'],
    optionsSuccessStatus: 204,
  });

  return { app, corsMiddleware, allowedOrigins };
}

// Simple in-memory simulator for express request through cors middleware
function simulateCorsRequest(corsMiddleware, { method, origin, headers = {} }) {
  return new Promise((resolve) => {
    const req = {
      method,
      headers: {
        origin,
        ...headers,
      },
    };

    const resHeaders = {};
    let resStatus = 200;

    const res = {
      statusCode: 200,
      setHeader(name, value) {
        resHeaders[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return resHeaders[name.toLowerCase()];
      },
      status(code) {
        resStatus = code;
        this.statusCode = code;
        return this;
      },
      end() {
        resolve({
          status: this.statusCode,
          headers: resHeaders,
          error: null,
        });
      },
    };

    corsMiddleware(req, res, (err) => {
      resolve({
        status: resStatus,
        headers: resHeaders,
        error: err || null,
      });
    });
  });
}

describe('Production CORS Settings Verification', () => {
  const { corsMiddleware, allowedOrigins } = buildCorsApp();

  it('includes deployed ApnaDigital domain and portals in allowed origins list', () => {
    assert.ok(allowedOrigins.includes('https://apnadigitalindia.com'));
    assert.ok(allowedOrigins.includes('https://hrm.vastoratech.com'));
    assert.ok(allowedOrigins.includes('https://hrmadmin.vastoratech.com'));
    assert.ok(allowedOrigins.includes('http://localhost:5173'));
    assert.ok(allowedOrigins.includes('http://localhost:3000'));
  });

  it('automatically permits any local development port without needing manual listing in CORS_ORIGIN', async () => {
    const localPorts = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
    ];

    for (const origin of localPorts) {
      const res = await simulateCorsRequest(corsMiddleware, {
        method: 'GET',
        origin,
      });

      assert.strictEqual(res.error, null, `Local origin ${origin} must be automatically permitted`);
      assert.strictEqual(res.headers['access-control-allow-origin'], origin);
    }
  });

  it('accepts preflight OPTIONS request from ApnaDigital with 204 status and allowed methods', async () => {
    const res = await simulateCorsRequest(corsMiddleware, {
      method: 'OPTIONS',
      origin: 'https://apnadigitalindia.com',
      headers: {
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    });

    assert.strictEqual(res.error, null);
    assert.strictEqual(res.status, 204, 'Preflight options status should be 204');
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://apnadigitalindia.com');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    assert.notStrictEqual(res.headers['access-control-allow-origin'], '*', 'Wildcard * must NOT be used');

    const methods = res.headers['access-control-allow-methods'];
    assert.ok(methods.includes('GET'));
    assert.ok(methods.includes('POST'));
    assert.ok(methods.includes('PUT'));
    assert.ok(methods.includes('PATCH'));
    assert.ok(methods.includes('DELETE'));
  });

  it('allows all specified HTTP methods (GET, POST, PUT, PATCH, DELETE) from ApnaDigital', async () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    for (const method of methods) {
      const res = await simulateCorsRequest(corsMiddleware, {
        method,
        origin: 'https://apnadigitalindia.com',
      });

      assert.strictEqual(res.error, null, `CORS should allow method ${method}`);
      assert.strictEqual(
        res.headers['access-control-allow-origin'],
        'https://apnadigitalindia.com',
        `Origin header must be present for method ${method}`
      );
      assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    }
  });

  it('allows requests from http://localhost:5173 with proper headers', async () => {
    const res = await simulateCorsRequest(corsMiddleware, {
      method: 'POST',
      origin: 'http://localhost:5173',
    });

    assert.strictEqual(res.error, null);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('allows requests with no origin header (server-to-server / curl / Postman)', async () => {
    const res = await simulateCorsRequest(corsMiddleware, {
      method: 'GET',
      origin: undefined,
    });

    assert.strictEqual(res.error, null);
  });

  it('blocks disallowed third-party origins securely', async () => {
    const res = await simulateCorsRequest(corsMiddleware, {
      method: 'POST',
      origin: 'https://unauthorized-malicious-domain.com',
    });

    assert.ok(res.error, 'Should throw an error for disallowed origin');
    assert.ok(res.error.message.includes('not allowed'));
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
  });
});
