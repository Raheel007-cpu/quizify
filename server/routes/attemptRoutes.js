const express = require('express');
const attemptController = require('../controllers/attemptController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authMiddleware');
const {
  startAttemptSchema,
  saveAnswerSchema,
  submitAttemptSchema,
} = require('../validators/attemptValidator');

const router = express.Router();

router.use(authenticate);

router.post('/start', validate(startAttemptSchema), attemptController.startAttempt);
router.get('/', attemptController.listAttempts);
router.get('/:id', attemptController.getAttempt);
router.put('/:id/answer', validate(saveAnswerSchema), attemptController.saveAnswer);
router.post('/:id/submit', validate(submitAttemptSchema), attemptController.submitAttempt);

module.exports = router;
