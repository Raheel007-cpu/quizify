import api from './api';

export const startQuizAttempt = async (quizId) => {
  const response = await api.post('/attempts/start', { quizId });
  return response.data;
};

export const getAttemptById = async (attemptId) => {
  const response = await api.get(`/attempts/${attemptId}`);
  return response.data;
};

export const saveAttemptAnswer = async (
  attemptId,
  questionId,
  selectedAnswer
) => {
  const response = await api.put(`/attempts/${attemptId}/answer`, {
    questionId,
    selectedAnswer,
  });
  return response.data;
};

export const submitQuizAttempt = async (attemptId, answers) => {
  const response = await api.post(`/attempts/${attemptId}/submit`, {
    answers,
  });
  return response.data;
};

export const getUserAttempts = async (params = {}) => {
  const response = await api.get('/attempts', { params });
  return response.data;
};
