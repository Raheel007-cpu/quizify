const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/overview', adminController.getOverview);
router.get('/attempts', adminController.listAttempts);

module.exports = router;
