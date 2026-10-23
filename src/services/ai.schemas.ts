import { z } from 'zod';

/**
 * Common constraints for AI prompts to protect against prompt injection,
 * token overflows, and out-of-memory issues.
 */
export const MAX_STUDY_MATERIAL_LENGTH = 50_000;
export const MIN_STUDY_MATERIAL_LENGTH = 10;
export const MAX_TOPIC_LENGTH = 500;

// =============================================================================
// Explain Endpoint Schemas
// =============================================================================

export const explainRequestSchema = z.object({
  studyMaterial: z
    .string({ required_error: 'studyMaterial is required' })
    .trim()
    .min(MIN_STUDY_MATERIAL_LENGTH, `studyMaterial must be at least ${MIN_STUDY_MATERIAL_LENGTH} characters`)
    .max(MAX_STUDY_MATERIAL_LENGTH, `studyMaterial cannot exceed ${MAX_STUDY_MATERIAL_LENGTH} characters`),
  topic: z
    .string({ required_error: 'topic is required' })
    .trim()
    .min(2, 'topic must be at least 2 characters')
    .max(MAX_TOPIC_LENGTH, `topic cannot exceed ${MAX_TOPIC_LENGTH} characters`),
  level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .default('beginner'),
});

export const explainResponseSchema = z.object({
  topic: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  foundInMaterial: z.boolean(),
  explanation: z.string(),
  keyPoints: z.array(z.string()).default([]),
  sourceContext: z.string(),
  limitations: z.string().nullish().transform((val) => val ?? 'None'),
});

export type ExplainRequest = z.infer<typeof explainRequestSchema>;
export type ExplainResponse = z.infer<typeof explainResponseSchema>;

// =============================================================================
// Quiz Endpoint Schemas
// =============================================================================

export const quizRequestSchema = z.object({
  studyMaterial: z
    .string({ required_error: 'studyMaterial is required' })
    .trim()
    .min(MIN_STUDY_MATERIAL_LENGTH, `studyMaterial must be at least ${MIN_STUDY_MATERIAL_LENGTH} characters`)
    .max(MAX_STUDY_MATERIAL_LENGTH, `studyMaterial cannot exceed ${MAX_STUDY_MATERIAL_LENGTH} characters`),
  topic: z
    .string()
    .trim()
    .min(2, 'topic must be at least 2 characters')
    .max(MAX_TOPIC_LENGTH, `topic cannot exceed ${MAX_TOPIC_LENGTH} characters`)
    .optional(),
  numQuestions: z
    .coerce
    .number()
    .int('numQuestions must be an integer')
    .min(1, 'Minimum 1 question')
    .max(10, 'Maximum 10 questions')
    .default(3),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium'),
});

export const quizQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.string(),
  explanation: z.string(),
  sourceQuote: z.string().nullish().transform((val) => val ?? ''),
});

export const quizResponseSchema = z.object({
  title: z.string(),
  foundInMaterial: z.boolean(),
  questions: z.array(quizQuestionSchema).default([]),
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizResponse = z.infer<typeof quizResponseSchema>;

// =============================================================================
// Practice Endpoint Schemas
// =============================================================================

export const practiceRequestSchema = z.object({
  studyMaterial: z
    .string({ required_error: 'studyMaterial is required' })
    .trim()
    .min(MIN_STUDY_MATERIAL_LENGTH, `studyMaterial must be at least ${MIN_STUDY_MATERIAL_LENGTH} characters`)
    .max(MAX_STUDY_MATERIAL_LENGTH, `studyMaterial cannot exceed ${MAX_STUDY_MATERIAL_LENGTH} characters`),
  topic: z
    .string()
    .trim()
    .min(2, 'topic must be at least 2 characters')
    .max(MAX_TOPIC_LENGTH, `topic cannot exceed ${MAX_TOPIC_LENGTH} characters`)
    .optional(),
  type: z
    .enum(['flashcards', 'open-ended', 'exercises'])
    .default('flashcards'),
  numItems: z
    .coerce
    .number()
    .int('numItems must be an integer')
    .min(1, 'Minimum 1 item')
    .max(10, 'Maximum 10 items')
    .default(3),
});

export const practiceItemSchema = z.object({
  id: z.number(),
  prompt: z.string(),
  solution: z.string(),
  hint: z.string().nullish().transform((val) => val ?? undefined),
  reference: z.string(),
});

export const practiceResponseSchema = z.object({
  topic: z.string(),
  type: z.enum(['flashcards', 'open-ended', 'exercises']),
  foundInMaterial: z.boolean(),
  items: z.array(practiceItemSchema).default([]),
});

export type PracticeRequest = z.infer<typeof practiceRequestSchema>;
export type PracticeItem = z.infer<typeof practiceItemSchema>;
export type PracticeResponse = z.infer<typeof practiceResponseSchema>;
