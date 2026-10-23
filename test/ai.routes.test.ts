import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express, { Application } from 'express';
import request from 'supertest';
import { createAiRouter } from '../src/routes/ai';
import { GeminiService } from '../src/services/gemini.service';
import { errorHandler } from '../src/middleware/errorHandler';
import { AppError } from '../src/utils/errors';
import {
  ExplainResponse,
  QuizResponse,
  PracticeResponse,
} from '../src/services/ai.schemas';

// Mock service implementing GeminiService for offline/deterministic testing
class MockGeminiService extends GeminiService {
  public explainResult?: ExplainResponse;
  public quizResult?: QuizResponse;
  public practiceResult?: PracticeResponse;
  public shouldThrow?: Error;

  public override async explain(): Promise<ExplainResponse> {
    if (this.shouldThrow) throw this.shouldThrow;
    return (
      this.explainResult || {
        topic: 'Photosynthesis',
        level: 'beginner',
        foundInMaterial: true,
        explanation: 'Photosynthesis converts light energy into chemical energy.',
        keyPoints: ['Light energy is captured', 'Produces glucose and oxygen'],
        sourceContext: 'Plants use sunlight to synthesize nutrients.',
        limitations: 'None',
      }
    );
  }

  public override async quiz(): Promise<QuizResponse> {
    if (this.shouldThrow) throw this.shouldThrow;
    return (
      this.quizResult || {
        title: 'Photosynthesis Fundamentals',
        foundInMaterial: true,
        questions: [
          {
            id: 1,
            question: 'What do plants use to synthesize nutrients?',
            options: ['Sunlight', 'Wind', 'Sound', 'Iron'],
            correctAnswer: 'Sunlight',
            explanation: 'The text states plants use sunlight to synthesize nutrients.',
            sourceQuote: 'Plants use sunlight to synthesize nutrients.',
          },
        ],
      }
    );
  }

  public override async practice(): Promise<PracticeResponse> {
    if (this.shouldThrow) throw this.shouldThrow;
    return (
      this.practiceResult || {
        topic: 'Photosynthesis',
        type: 'flashcards',
        foundInMaterial: true,
        items: [
          {
            id: 1,
            prompt: 'What energy conversion occurs in photosynthesis?',
            solution: 'Light energy is converted into chemical energy.',
            hint: 'Think about sunlight and glucose.',
            reference: 'Photosynthesis converts light energy into chemical energy.',
          },
        ],
      }
    );
  }
}

const createTestApp = (mockService: MockGeminiService): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', createAiRouter(mockService));
  app.use(errorHandler);
  return app;
};

describe('AI Routes with Mocked Gemini (Runs without real API key)', () => {
  it('POST /api/ai/explain returns 200 and grounded explanation data', async () => {
    const mockService = new MockGeminiService();
    const app = createTestApp(mockService);

    const res = await request(app).post('/api/ai/explain').send({
      studyMaterial: 'Plants use sunlight to synthesize nutrients from carbon dioxide and water.',
      topic: 'Photosynthesis',
      level: 'beginner',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.topic, 'Photosynthesis');
    assert.equal(res.body.data.foundInMaterial, true);
    assert.ok(res.body.data.explanation);
    assert.ok(Array.isArray(res.body.data.keyPoints));
    assert.ok(res.body.data.sourceContext);
  });

  it('POST /api/ai/explain handles topic NOT found in material', async () => {
    const mockService = new MockGeminiService();
    mockService.explainResult = {
      topic: 'Quantum Mechanics',
      level: 'beginner',
      foundInMaterial: false,
      explanation: 'Quantum Mechanics is not covered in the provided study material.',
      keyPoints: ['Topic absent from study material'],
      sourceContext: 'Not present in provided material',
      limitations: 'The provided text only discusses plant biology.',
    };
    const app = createTestApp(mockService);

    const res = await request(app).post('/api/ai/explain').send({
      studyMaterial: 'Plants use sunlight to synthesize nutrients from carbon dioxide and water.',
      topic: 'Quantum Mechanics',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.foundInMaterial, false);
    assert.equal(res.body.data.sourceContext, 'Not present in provided material');
  });

  it('POST /api/ai/quiz returns 200 and grounded quiz questions', async () => {
    const mockService = new MockGeminiService();
    const app = createTestApp(mockService);

    const res = await request(app).post('/api/ai/quiz').send({
      studyMaterial: 'Plants use sunlight to synthesize nutrients from carbon dioxide and water.',
      numQuestions: 1,
      difficulty: 'easy',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.foundInMaterial, true);
    assert.equal(res.body.data.questions.length, 1);
    assert.equal(res.body.data.questions[0].correctAnswer, 'Sunlight');
    assert.ok(res.body.data.questions[0].sourceQuote);
  });

  it('POST /api/ai/practice returns 200 and practice flashcards/exercises', async () => {
    const mockService = new MockGeminiService();
    const app = createTestApp(mockService);

    const res = await request(app).post('/api/ai/practice').send({
      studyMaterial: 'Plants use sunlight to synthesize nutrients from carbon dioxide and water.',
      type: 'flashcards',
      numItems: 1,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.type, 'flashcards');
    assert.equal(res.body.data.items.length, 1);
    assert.ok(res.body.data.items[0].prompt);
    assert.ok(res.body.data.items[0].solution);
  });

  it('safely handles AI service rate limit error without leaking secrets', async () => {
    const mockService = new MockGeminiService();
    mockService.shouldThrow = new AppError('AI service quota or rate limit exceeded.', 429);
    const app = createTestApp(mockService);

    const res = await request(app).post('/api/ai/explain').send({
      studyMaterial: 'Valid material for testing error responses.',
      topic: 'Error Test',
    });

    assert.equal(res.status, 429);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'APP_ERROR');
    assert.equal(res.body.error.message, 'AI service quota or rate limit exceeded.');
  });
});
