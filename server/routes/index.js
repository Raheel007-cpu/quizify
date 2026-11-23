const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Quizify REST API',
      version: '1.0.0',
      phase: 1,
    },
  });
});

router.use('/health', healthRoutes);

module.exports = router;
