const express = require('express');
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { updateProfileSchema } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// Admin-only route for listing users
router.get('/', authorize('ADMIN'), userController.listUsers);

module.exports = router;
