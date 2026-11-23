const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const categoryService = require('../services/categoryService');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories({
    subjectId: req.query.subjectId,
    search: req.query.search,
  });
  res.status(200).json({ success: true, data: { categories } });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'category ID');
  const category = await categoryService.getCategoryById(id);
  res.status(200).json({ success: true, data: { category } });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'category ID');
  const category = await categoryService.updateCategory(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category },
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'category ID');
  await categoryService.deleteCategory(id);
  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
