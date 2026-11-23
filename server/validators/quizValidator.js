const { z } = require('zod');

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const QUIZ_STATUSES = ['DRAFT', 'PUBLISHED'];

const createQuizSchema = z.object({
  categoryId: z.coerce
    .number({ invalid_type_error: 'Category is required' })
    .int()
    .positive('Please select a valid category'),
  title: z
    .string({ required_error: 'Quiz title is required' })
    .trim()
    .min(3, 'Quiz title must be at least 3 characters')
    .max(160, 'Quiz title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional()
    .or(z.literal('')),
  difficulty: z.enum(DIFFICULTIES, {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }),
  timeLimit: z.coerce
    .number({ invalid_type_error: 'Time limit must be a number' })
    .int()
    .min(1, 'Time limit must be at least 1 minute')
    .max(180, 'Time limit cannot exceed 180 minutes'),
  passingScore: z.coerce
    .number({ invalid_type_error: 'Passing score must be a number' })
    .int()
    .min(1, 'Passing score must be at least 1%')
    .max(100, 'Passing score cannot exceed 100%'),
  questionCount: z.coerce
    .number({ invalid_type_error: 'Question count must be a number' })
    .int()
    .min(1, 'Quiz must have at least 1 question')
    .max(100, 'Question count cannot exceed 100'),
  status: z.enum(QUIZ_STATUSES).optional().default('DRAFT'),
  questionIds: z
    .array(z.coerce.number().int().positive())
    .optional()
    .default([]),
});

const updateQuizSchema = createQuizSchema.partial();

module.exports = {
  createQuizSchema,
  updateQuizSchema,
};
