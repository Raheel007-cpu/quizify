import api from './api';

export const getQuizzes = async (params = {}) => {
  const response = await api.get('/quizzes', { params });
  return response.data;
};

export const getQuizById = async (id) => {
  const response = await api.get(`/quizzes/${id}`);
  return response.data;
};

export const createQuiz = async (payload) => {
  const response = await api.post('/quizzes', payload);
  return response.data;
};

export const updateQuiz = async (id, payload) => {
  const response = await api.put(`/quizzes/${id}`, payload);
  return response.data;
};

export const deleteQuiz = async (id) => {
  const response = await api.delete(`/quizzes/${id}`);
  return response.data;
};
