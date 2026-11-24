import api from './api';

export const getAnalyticsOverview = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getAnalyticsPerformance = async () => {
  const response = await api.get('/analytics/performance');
  return response.data;
};

export const getAnalyticsSubjects = async () => {
  const response = await api.get('/analytics/subjects');
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};
