import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyisipkan token jika diperlukan nanti
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response untuk mengekstrak data dari struktur { data: ... }
axiosClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;