import axios from 'axios';

// สร้าง axios instance พร้อมกับ baseURL
const api = axios.create({
  // ใช้ relative URL ที่จะทำงานได้ทั้งใน development และ production
  // ไม่ว่าจะเป็น Railway หรือ hosting อื่นๆ
  baseURL: '/',
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