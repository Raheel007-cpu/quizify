const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const listSubjects = async ({ search } = {}) => {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  return prisma.subject.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { categories: true },
      },
      categories: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          _count: {
            select: { quizzes: true, questions: true },
          },
        },
      },
    },
  });
};

const getSubjectById = async (id) => {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { name: 'asc' },
        include: {
          quizzes: {
            where: { status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  subject: { select: { id: true, name: true } },
                },
              },
              _count: {
                select: { quizQuestions: true, attempts: true },
              },
            },
          },
          _count: {
            select: { quizzes: true, questions: true },
          },
        },
      },
    },
  });

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  return subject;
};

const createSubject = async ({ name, description }) => {
  const existing = await prisma.subject.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, 'A subject with this name already exists');
  }

  return prisma.subject.create({
    data: {
      name,
      description: description || null,
    },
  });
};

const updateSubject = async (id, { name, description }) => {
  const existing = await prisma.subject.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!existing) {
    throw new ApiError(404, 'Subject not found');
  }

  if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await prisma.subject.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ApiError(409, 'A subject with this name already exists');
    }
  }

  return prisma.subject.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
    },
  });
};

const deleteSubject = async (id) => {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      _count: {
        select: { categories: true },
      },
    },
  });

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  if (subject._count.categories > 0) {
    throw new ApiError(
      409,
      'Cannot delete subject while it still has categories. Delete its categories first.'
    );
  }

  await prisma.subject.delete({ where: { id } });
};

module.exports = {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};
