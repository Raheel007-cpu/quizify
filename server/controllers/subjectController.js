const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const subjectService = require('../services/subjectService');

const listSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.listSubjects({
    search: req.query.search,
  });
  res.status(200).json({ success: true, data: { subjects } });
});

const getSubjectById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'subject ID');
  const subject = await subjectService.getSubjectById(id);
  res.status(200).json({ success: true, data: { subject } });
});

const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);
  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: { subject },
  });
});

const updateSubject = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'subject ID');
  const subject = await subjectService.updateSubject(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Subject updated successfully',
    data: { subject },
  });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'subject ID');
  await subjectService.deleteSubject(id);
  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully',
  });
});

module.exports = {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};
