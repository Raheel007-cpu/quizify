const { z } = require('zod');

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

const optionalOptionSchema = (label) =>
  z
    .union([
      z.string().trim().max(500, `${label} must be 500 characters or fewer`),
      z.null(),
    ])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === null || val === '') return null;
      return val;
    });

const questionBaseSchema = z.object({
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
  optionC: optionalOptionSchema('Option C'),
  optionD: optionalOptionSchema('Option D'),
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

const hasNonEmptyOption = (val) => typeof val === 'string' && val.trim().length > 0;

const createQuestionSchema = questionBaseSchema.superRefine((data, ctx) => {
  if (data.correctAnswer === 'C' && !hasNonEmptyOption(data.optionC)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['correctAnswer'],
      message: 'Correct answer cannot be C when Option C is empty',
    });
  }
  if (data.correctAnswer === 'D' && !hasNonEmptyOption(data.optionD)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['correctAnswer'],
      message: 'Correct answer cannot be D when Option D is empty',
    });
  }
});

const updateQuestionSchema = questionBaseSchema.partial();

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
};
