const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/performance', analyticsController.getPerformance);
router.get('/subjects', analyticsController.getSubjectsAnalytics);

module.exports = router;

