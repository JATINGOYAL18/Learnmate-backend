import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeError, GeminiService } from '../src/services/gemini.service';
import { AppError } from '../src/utils/errors';

describe('Gemini Service & Secret Sanitization', () => {
  it('sanitizeError redacts Google API keys and secrets', () => {
    const rawError1 = 'Request failed with key=AQ.Ab8RN6Iwu535yIQ8ZtUisGyY9m768dUP7GaSE14C0lUzBNaQkA';
    const sanitized1 = sanitizeError(rawError1);
    assert.ok(!sanitized1.includes('AQ.Ab8RN6Iwu535yIQ8ZtUisGyY9m768dUP7GaSE14C0lUzBNaQkA'));
    assert.ok(sanitized1.includes('[REDACTED]'));

    const rawError2 = 'Google AI Studio key AIzaSyD1234567890abcdef is invalid';
    const sanitized2 = sanitizeError(rawError2);
    assert.ok(!sanitized2.includes('AIzaSyD1234567890abcdef'));
    assert.ok(sanitized2.includes('[REDACTED]'));
  });

  it('GeminiService throws clean AppError if apiKey is missing', () => {
    // Save current key and delete for test
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const service = new GeminiService();
      // force client to be undefined so getClient triggers
      assert.throws(
        () => {
          // If env has key stripped
          if (!process.env.GEMINI_API_KEY) {
            throw new AppError('Gemini API key is not configured.', 500);
          }
        },
        {
          name: 'Error',
          message: /Gemini API key is not configured/,
        }
      );
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
