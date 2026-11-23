import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPlainProxyError =
      error.response?.status === 500 &&
      (typeof error.response?.data !== 'object' || error.response?.data === null);

    const normalizedError = {
      status: error.response?.status || null,
      message: isPlainProxyError
        ? 'Cannot reach the Quizify backend server. Make sure `npm run dev` is running in the server folder.'
        : error.response?.data?.message ||
          error.message ||
          'An unexpected network error occurred',
      data: error.response?.data || null,
    };
    return Promise.reject(normalizedError);
  }
);

export default api;
