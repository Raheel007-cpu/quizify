const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const listCategories = async ({ subjectId, search } = {}) => {
  const where = {
    ...(subjectId ? { subjectId: Number(subjectId) } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return prisma.category.findMany({
    where,
    orderBy: [{ subject: { name: 'asc' } }, { name: 'asc' }],
    include: {
      subject: {
        select: { id: true, name: true },
      },
      _count: {
        select: { quizzes: true, questions: true },
      },
    },
  });
};

const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subject: {
        select: { id: true, name: true },
      },
      _count: {
        select: { quizzes: true, questions: true },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  return category;
};

const createCategory = async ({ subjectId, name, description }) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new ApiError(404, 'Selected subject not found');
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      subjectId,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new ApiError(
      409,
      'A category with this name already exists under this subject'
    );
  }

  return prisma.category.create({
    data: {
      subjectId,
      name,
      description: description || null,
    },
    include: {
      subject: { select: { id: true, name: true } },
      _count: { select: { quizzes: true, questions: true } },
    },
  });
};

const updateCategory = async (id, { subjectId, name, description }) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, subjectId: true, name: true },
  });

  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  const targetSubjectId = subjectId ?? existing.subjectId;
  const targetName = name ?? existing.name;

  if (subjectId !== undefined) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) {
      throw new ApiError(404, 'Selected subject not found');
    }
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      subjectId: targetSubjectId,
      name: { equals: targetName, mode: 'insensitive' },
      NOT: { id },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new ApiError(
      409,
      'A category with this name already exists under this subject'
    );
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(subjectId !== undefined ? { subjectId } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
    },
    include: {
      subject: { select: { id: true, name: true } },
      _count: { select: { quizzes: true, questions: true } },
    },
  });
};

const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { quizzes: true, questions: true } },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (category._count.quizzes > 0 || category._count.questions > 0) {
    throw new ApiError(
      409,
      'Cannot delete category while quizzes or questions belong to it.'
    );
  }

  await prisma.category.delete({ where: { id } });
};

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
