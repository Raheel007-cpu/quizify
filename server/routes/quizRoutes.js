const express = require('express');
const quizController = require('../controllers/quizController');
const validate = require('../middleware/validate');
const {
  authenticate,
  optionalAuthenticate,
  authorize,
} = require('../middleware/authMiddleware');
const {
  createQuizSchema,
  updateQuizSchema,
} = require('../validators/quizValidator');

const router = express.Router();

router.get('/', optionalAuthenticate, quizController.listQuizzes);
router.get('/:id', optionalAuthenticate, quizController.getQuizById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createQuizSchema),
  quizController.createQuiz
);
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateQuizSchema),
  quizController.updateQuiz
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  quizController.deleteQuiz
);

module.exports = router;
