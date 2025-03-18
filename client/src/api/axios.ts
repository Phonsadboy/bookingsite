import axios from 'axios';

// สร้าง axios instance พร้อมกับ baseURL
const api = axios.create({
  // ตรวจสอบว่า URL ที่ถูกต้องควรเป็นแบบใด
  baseURL: 'https://web-production-dd29.up.railway.app',
  // เพิ่ม timeout เพื่อให้มีเวลาในการเชื่อมต่อมากขึ้น
  timeout: 10000,
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