const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const questionService = require('../services/questionService');

const listQuestions = asyncHandler(async (req, res) => {
  const result = await questionService.listQuestions(req.query);
  res.status(200).json({ success: true, data: result });
});

const getQuestionById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'question ID');
  const question = await questionService.getQuestionById(id);
  res.status(200).json({ success: true, data: { question } });
});

const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.body);
  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: { question },
  });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'question ID');
  const question = await questionService.updateQuestion(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Question updated successfully',
    data: { question },
  });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'question ID');
  await questionService.deleteQuestion(id);
  res.status(200).json({
    success: true,
    message: 'Question deleted successfully',
  });
});

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
