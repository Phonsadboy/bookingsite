import axios from 'axios';

// สร้าง axios instance พร้อมกับ baseURL
const api = axios.create({
  baseURL: window.location.origin,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 