import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health & Root Routes', () => {
  const app = createApp();

  it('GET / returns 200 and service metadata', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.service, 'LearnMate API');
    assert.equal(res.body.status, 'running');
    assert.ok(res.body.endpoints.health);
    assert.ok(res.body.endpoints.aiExplain);
  });

  it('GET /api/health returns 200 and health info', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'learnmate-backend');
    assert.ok(typeof res.body.uptimeSeconds === 'number');
  });

  it('GET /api/health?verbose=invalid returns 400 validation error', async () => {
    const res = await request(app).get('/api/health?verbose=invalid');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('GET /non-existent-route returns 404', async () => {
    const res = await request(app).get('/non-existent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
  });
});
