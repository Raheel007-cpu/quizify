const express = require('express');
const questionController = require('../controllers/questionController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createQuestionSchema,
  updateQuestionSchema,
} = require('../validators/questionValidator');

const router = express.Router();

// Question Bank contains correct answers & explanations; restrict to ADMIN
router.use(authenticate, authorize('ADMIN'));

router.get('/', questionController.listQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', validate(createQuestionSchema), questionController.createQuestion);
router.put('/:id', validate(updateQuestionSchema), questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
