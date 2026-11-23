const express = require('express');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/subjectValidator');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategoryById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCategorySchema),
  categoryController.createCategory
);
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  categoryController.deleteCategory
);

module.exports = router;
