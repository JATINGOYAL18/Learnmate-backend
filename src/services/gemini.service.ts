import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import {
  ExplainRequest,
  ExplainResponse,
  explainResponseSchema,
  QuizRequest,
  QuizResponse,
  quizResponseSchema,
  PracticeRequest,
  PracticeResponse,
  practiceResponseSchema,
} from './ai.schemas';

const SYSTEM_INSTRUCTION = `You are LearnMate, an expert academic tutor.
Your core mission is to help students learn with absolute academic integrity.

CRITICAL GROUNDING RULES:
1. STRICT GROUNDING: You MUST base your entire response EXCLUSIVELY on the facts, concepts, and context present in the provided STUDY MATERIAL. Do NOT use outside knowledge, assumed facts, or unstated premises.
2. NO HALLUCINATION: Never fabricate citations, page numbers, quotations, facts, or claims.
3. ABSENCE OF INFORMATION: If the requested topic or question is NOT covered, or only partially covered, in the study material, you MUST set "foundInMaterial": false and explicitly state in the explanation, solution, or limitations that the information is not present in the provided study material. Do NOT guess or invent facts.
4. ACCURATE REFERENCES: When providing quotes or references (e.g. sourceQuote, sourceContext, reference), provide accurate, direct excerpts from the provided text.
5. JSON FORMAT: You MUST return a single, strictly valid JSON object matching the requested schema without any markdown wrapping or commentary.`;

/**
 * Sanitizes any potential secrets (such as API keys) from error messages before logging or throwing.
 */
export const sanitizeError = (message: string): string => {
  return message
    .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]')
    .replace(/AQ\.[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/AIza[A-Za-z0-9_-]+/g, '[REDACTED]');
};

export class GeminiService {
  private client?: GoogleGenAI;

  constructor(customClient?: GoogleGenAI) {
    this.client = customClient;
  }

  /**
   * Lazily initializes the GoogleGenAI SDK client.
   */
  public getClient(): GoogleGenAI {
    if (this.client) return this.client;

    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '') {
      throw new AppError(
        'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.',
        500
      );
    }

    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    return this.client;
  }

  /**
   * Executes an asynchronous operation with automatic retry for transient 503 / high demand spikes.
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1500): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        const raw = err instanceof Error ? err.message : String(err);
        const isTransient =
          raw.includes('503') ||
          raw.includes('UNAVAILABLE') ||
          raw.toLowerCase().includes('high demand') ||
          raw.toLowerCase().includes('overloaded');

        if (isTransient && attempt < maxRetries) {
          console.warn(`[Gemini Service] Transient 503/demand spike encountered. Retrying (${attempt}/${maxRetries}) in ${delayMs}ms...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        throw err;
      }
    }
    throw new AppError('AI service is temporarily experiencing high demand. Please try again in a few moments.', 503);
  }

  /**
   * Translates upstream Gemini errors into user-safe AppErrors without leaking API keys.
   */
  private handleApiError(err: unknown): never {
    const rawMessage = err instanceof Error ? err.message : String(err);
    const safeMessage = sanitizeError(rawMessage);

    console.error('[Gemini Service Error]:', safeMessage);

    if (safeMessage.includes('503') || safeMessage.includes('UNAVAILABLE') || safeMessage.toLowerCase().includes('high demand')) {
      throw new AppError('AI service is temporarily experiencing high demand. Please try again in a few moments.', 503);
    }
    if (safeMessage.toLowerCase().includes('quota') || safeMessage.includes('429')) {
      throw new AppError('AI service quota or rate limit exceeded. Please wait a moment and try again.', 429);
    }
    if (safeMessage.toLowerCase().includes('api key') || safeMessage.includes('API_KEY_INVALID')) {
      throw new AppError('Invalid Gemini API configuration. Please verify your GEMINI_API_KEY.', 500);
    }
    if (safeMessage.toLowerCase().includes('not found') || safeMessage.includes('404')) {
      throw new AppError(`Configured AI model '${env.GEMINI_MODEL}' could not be reached.`, 502);
    }

    throw new AppError('Failed to generate response from Gemini AI. Please try again.', 502);
  }

  /**
   * Generates a grounded explanation for a specific concept or topic.
   */
  public async explain(request: ExplainRequest): Promise<ExplainResponse> {
    const client = this.getClient();

    const userPrompt = `STUDY MATERIAL:
---
${request.studyMaterial}
---

TASK:
Explain the topic: "${request.topic}"
Target student level: ${request.level}

Return a JSON object matching this schema:
{
  "topic": "${request.topic}",
  "level": "${request.level}",
  "foundInMaterial": true/false,
  "explanation": "Grounded explanation strictly from the study material",
  "keyPoints": ["Key point 1", "Key point 2"],
  "sourceContext": "Verbatim quote or excerpt from the study material, or 'Not present in provided material'",
  "limitations": "Notes on any aspects not covered in the study material"
}`;

    try {
      const response = await this.executeWithRetry(() =>
        client.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        })
      );

      const rawText = response.text;
      if (!rawText) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(rawText);
      return explainResponseSchema.parse(parsed);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.handleApiError(error);
    }
  }

  /**
   * Generates grounded multiple-choice quiz questions based strictly on the study material.
   */
  public async quiz(request: QuizRequest): Promise<QuizResponse> {
    const client = this.getClient();

    const userPrompt = `STUDY MATERIAL:
---
${request.studyMaterial}
---

TASK:
Create a multiple-choice quiz with ${request.numQuestions} question(s).
${request.topic ? `Focus specifically on: "${request.topic}"` : 'Cover the core concepts present in the text.'}
Difficulty: ${request.difficulty}

Return a JSON object matching this schema:
{
  "title": "Quiz Title strictly grounded in material",
  "foundInMaterial": true/false,
  "questions": [
    {
      "id": 1,
      "question": "Question based directly on facts in the study material",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact string of the correct option",
      "explanation": "Why this answer is correct according to the study material",
      "sourceQuote": "Direct quote from the study material proving this answer"
    }
  ]
}`;

    try {
      const response = await this.executeWithRetry(() =>
        client.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        })
      );

      const rawText = response.text;
      if (!rawText) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(rawText);
      return quizResponseSchema.parse(parsed);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.handleApiError(error);
    }
  }

  /**
   * Generates grounded practice exercises or flashcards based on the study material.
   */
  public async practice(request: PracticeRequest): Promise<PracticeResponse> {
    const client = this.getClient();

    const userPrompt = `STUDY MATERIAL:
---
${request.studyMaterial}
---

TASK:
Generate ${request.numItems} practice item(s) of type "${request.type}".
${request.topic ? `Focus on: "${request.topic}"` : 'Cover key concepts from the material.'}

Return a JSON object matching this schema:
{
  "topic": "${request.topic || 'Core Material'}",
  "type": "${request.type}",
  "foundInMaterial": true/false,
  "items": [
    {
      "id": 1,
      "prompt": "Practice problem prompt or flashcard front",
      "solution": "Solution or flashcard back strictly from the text",
      "hint": "Optional hint from text",
      "reference": "Direct sentence or excerpt from the study material"
    }
  ]
}`;

    try {
      const response = await this.executeWithRetry(() =>
        client.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        })
      );

      const rawText = response.text;
      if (!rawText) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(rawText);
      return practiceResponseSchema.parse(parsed);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.handleApiError(error);
    }
  }
}

export const geminiService = new GeminiService();
