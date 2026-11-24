const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuthenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuthenticate, leaderboardController.getLeaderboard);

module.exports = router;
