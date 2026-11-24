const { z } = require('zod');

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

const startAttemptSchema = z.object({
  quizId: z.coerce
    .number({ invalid_type_error: 'Quiz ID is required' })
    .int()
    .positive('Please provide a valid quiz ID'),
});

const saveAnswerSchema = z.object({
  questionId: z.coerce
    .number({ invalid_type_error: 'Question ID is required' })
    .int()
    .positive('Invalid question ID'),
  selectedAnswer: z.enum(ANSWER_OPTIONS).nullable(),
});

const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        selectedAnswer: z.enum(ANSWER_OPTIONS).nullable(),
      })
    )
    .optional()
    .default([]),
});

module.exports = {
  startAttemptSchema,
  saveAnswerSchema,
  submitAttemptSchema,
};
