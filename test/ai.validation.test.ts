import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';

describe('AI Endpoint Request Validation (No API key needed)', () => {
  const app = createApp();

  describe('POST /api/ai/explain validation', () => {
    it('rejects empty request body with 400', async () => {
      const res = await request(app).post('/api/ai/explain').send({});
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('rejects studyMaterial that is too short (< 10 chars)', async () => {
      const res = await request(app)
        .post('/api/ai/explain')
        .send({ studyMaterial: 'short', topic: 'Testing' });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error.details.some((d: { field: string }) => d.field === 'studyMaterial')
      );
    });

    it('rejects missing topic', async () => {
      const res = await request(app)
        .post('/api/ai/explain')
        .send({ studyMaterial: 'This is a sufficiently long study material text.' });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.details.some((d: { field: string }) => d.field === 'topic'));
    });

    it('rejects invalid level enum', async () => {
      const res = await request(app).post('/api/ai/explain').send({
        studyMaterial: 'This is a sufficiently long study material text.',
        topic: 'Valid Topic',
        level: 'expert-level',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.details.some((d: { field: string }) => d.field === 'level'));
    });

    it('rejects studyMaterial exceeding 50,000 characters', async () => {
      const hugeText = 'a'.repeat(50_001);
      const res = await request(app).post('/api/ai/explain').send({
        studyMaterial: hugeText,
        topic: 'Photosynthesis',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error.details.some((d: { field: string }) => d.field === 'studyMaterial')
      );
    });
  });

  describe('POST /api/ai/quiz validation', () => {
    it('rejects missing studyMaterial', async () => {
      const res = await request(app).post('/api/ai/quiz').send({ numQuestions: 3 });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error.details.some((d: { field: string }) => d.field === 'studyMaterial')
      );
    });

    it('rejects numQuestions less than 1', async () => {
      const res = await request(app).post('/api/ai/quiz').send({
        studyMaterial: 'Valid material for testing the quiz endpoint.',
        numQuestions: 0,
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error.details.some((d: { field: string }) => d.field === 'numQuestions')
      );
    });

    it('rejects numQuestions greater than 10', async () => {
      const res = await request(app).post('/api/ai/quiz').send({
        studyMaterial: 'Valid material for testing the quiz endpoint.',
        numQuestions: 15,
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error.details.some((d: { field: string }) => d.field === 'numQuestions')
      );
    });

    it('rejects invalid difficulty enum', async () => {
      const res = await request(app).post('/api/ai/quiz').send({
        studyMaterial: 'Valid material for testing the quiz endpoint.',
        difficulty: 'extreme',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(
        res.body.error.details.some((d: { field: string }) => d.field === 'difficulty')
      );
    });
  });

  describe('POST /api/ai/practice validation', () => {
    it('rejects invalid practice type', async () => {
      const res = await request(app).post('/api/ai/practice').send({
        studyMaterial: 'Valid study material text for testing practice endpoint.',
        type: 'invalid-type',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.details.some((d: { field: string }) => d.field === 'type'));
    });

    it('rejects numItems greater than 10', async () => {
      const res = await request(app).post('/api/ai/practice').send({
        studyMaterial: 'Valid study material text for testing practice endpoint.',
        numItems: 12,
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.details.some((d: { field: string }) => d.field === 'numItems'));
    });
  });
});
