const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const subjectRoutes = require('./subjectRoutes');
const categoryRoutes = require('./categoryRoutes');
const questionRoutes = require('./questionRoutes');
const quizRoutes = require('./quizRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Quizify REST API',
      version: '1.0.0',
      phase: 3,
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/categories', categoryRoutes);
router.use('/questions', questionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
