const { z } = require('zod');

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

const createQuestionSchema = z.object({
  categoryId: z.coerce
    .number({ invalid_type_error: 'Category is required' })
    .int()
    .positive('Please select a valid category'),
  questionText: z
    .string({ required_error: 'Question text is required' })
    .trim()
    .min(5, 'Question text must be at least 5 characters')
    .max(2000, 'Question text must be 2000 characters or fewer'),
  optionA: z
    .string({ required_error: 'Option A is required' })
    .trim()
    .min(1, 'Option A is required')
    .max(500, 'Option A must be 500 characters or fewer'),
  optionB: z
    .string({ required_error: 'Option B is required' })
    .trim()
    .min(1, 'Option B is required')
    .max(500, 'Option B must be 500 characters or fewer'),
  optionC: z
    .string({ required_error: 'Option C is required' })
    .trim()
    .min(1, 'Option C is required')
    .max(500, 'Option C must be 500 characters or fewer'),
  optionD: z
    .string({ required_error: 'Option D is required' })
    .trim()
    .min(1, 'Option D is required')
    .max(500, 'Option D must be 500 characters or fewer'),
  correctAnswer: z.enum(ANSWER_OPTIONS, {
    errorMap: () => ({ message: 'Correct answer must be A, B, C, or D' }),
  }),
  explanation: z
    .string()
    .trim()
    .max(2000, 'Explanation must be 2000 characters or fewer')
    .optional()
    .or(z.literal('')),
  difficulty: z.enum(DIFFICULTIES, {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }),
});

const updateQuestionSchema = createQuestionSchema.partial();

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
};
