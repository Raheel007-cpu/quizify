import api from './api';

export const getAdminOverview = async () => {
  const response = await api.get('/admin/overview');
  return response.data;
};

export const getAdminAttempts = async (params = {}) => {
  const response = await api.get('/admin/attempts', { params });
  return response.data;
};
