import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (payload) => {
  const response = await api.put('/users/profile', payload);
  return response.data;
};

export const listUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};
