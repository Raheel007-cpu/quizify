const { z } = require('zod');

const createSubjectSchema = z.object({
  name: z
    .string({ required_error: 'Subject name is required' })
    .trim()
    .min(2, 'Subject name must be at least 2 characters')
    .max(100, 'Subject name must be 100 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .optional()
    .or(z.literal('')),
});

const updateSubjectSchema = createSubjectSchema.partial().refine(
  (data) => data.name !== undefined || data.description !== undefined,
  { message: 'At least one field must be provided for update' }
);

const createCategorySchema = z.object({
  subjectId: z.coerce
    .number({ invalid_type_error: 'Subject is required' })
    .int()
    .positive('Please select a valid subject'),
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be 100 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .optional()
    .or(z.literal('')),
});

const updateCategorySchema = createCategorySchema.partial().refine(
  (data) =>
    data.subjectId !== undefined ||
    data.name !== undefined ||
    data.description !== undefined,
  { message: 'At least one field must be provided for update' }
);

module.exports = {
  createSubjectSchema,
  updateSubjectSchema,
  createCategorySchema,
  updateCategorySchema,
};
