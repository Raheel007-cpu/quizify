const express = require('express');
const subjectController = require('../controllers/subjectController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createSubjectSchema,
  updateSubjectSchema,
} = require('../validators/subjectValidator');

const router = express.Router();

router.get('/', subjectController.listSubjects);
router.get('/:id', subjectController.getSubjectById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createSubjectSchema),
  subjectController.createSubject
);
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateSubjectSchema),
  subjectController.updateSubject
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  subjectController.deleteSubject
);

module.exports = router;
