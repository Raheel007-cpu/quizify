const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const quizService = require('../services/quizService');

const listQuizzes = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const result = await quizService.listQuizzes(req.query, { isAdmin });
  res.status(200).json({ success: true, data: result });
});

const getQuizById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'quiz ID');
  const isAdmin = req.user?.role === 'ADMIN';
  const quiz = await quizService.getQuizById(id, { isAdmin });
  res.status(200).json({ success: true, data: { quiz } });
});

const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.createQuiz(req.body);
  res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    data: { quiz },
  });
});

const updateQuiz = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'quiz ID');
  const quiz = await quizService.updateQuiz(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Quiz updated successfully',
    data: { quiz },
  });
});

const deleteQuiz = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'quiz ID');
  await quizService.deleteQuiz(id);
  res.status(200).json({
    success: true,
    message: 'Quiz deleted successfully',
  });
});

module.exports = {
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
};
