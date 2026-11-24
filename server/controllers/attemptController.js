const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const attemptService = require('../services/attemptService');

const startAttempt = asyncHandler(async (req, res) => {
  const result = await attemptService.startQuizAttempt(
    req.user.id,
    req.body.quizId
  );

  res.status(result.resumed ? 200 : 201).json({
    success: true,
    message: result.resumed
      ? 'Resumed your in-progress quiz attempt'
      : 'Quiz attempt started',
    data: result,
  });
});

const getAttempt = asyncHandler(async (req, res) => {
  const attemptId = parseId(req.params.id, 'attempt ID');
  const data = await attemptService.getAttemptById(attemptId, req.user);

  res.status(200).json({
    success: true,
    data,
  });
});

const saveAnswer = asyncHandler(async (req, res) => {
  const attemptId = parseId(req.params.id, 'attempt ID');
  const saved = await attemptService.saveAttemptAnswer(
    attemptId,
    req.user.id,
    req.body
  );

  res.status(200).json({
    success: true,
    data: { answer: saved },
  });
});

const submitAttempt = asyncHandler(async (req, res) => {
  const attemptId = parseId(req.params.id, 'attempt ID');
  const result = await attemptService.submitQuizAttempt(
    attemptId,
    req.user.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: { attempt: result },
  });
});

const listAttempts = asyncHandler(async (req, res) => {
  const result = await attemptService.listUserAttempts(req.user.id, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  listAttempts,
};
