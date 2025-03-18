import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import api from '../api/axios';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  totalLessons: number;
  usedLessons: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Set default headers for all axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // เพิ่ม x-auth-token header
          axios.defaults.headers.common['x-auth-token'] = token;
          
          console.log('โหลดข้อมูลผู้ใช้...');
          console.log('ตั้งค่า Authorization header:', `Bearer ${token.substring(0, 10)}...`);
          console.log('ตั้งค่า x-auth-token header:', `${token.substring(0, 10)}...`);
          
          // You would typically have an endpoint to get user data
          // For now, we'll just decode the token or use stored user data
          const userData = JSON.parse(localStorage.getItem('user') || 'null');
          if (userData) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Error loading user', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      // ตรวจสอบก่อนว่ามีการส่งข้อมูลครบหรือไม่
      if (!username || !password) {
        throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      }
      
      console.log('Attempting login with:', { username, password: '****' });
      
      // ใช้ path ที่ถูกต้อง /api/auth/login ตามที่กำหนดใน server.js
      const res = await api.post('/api/auth/login', { 
        username, 
        password 
      });
      
      const { token, user } = res.data;
      
      if (!token || !user) {
        throw new Error('ข้อมูลตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      // ตั้งค่า headers
      console.log('ล็อกอินสำเร็จ, กำลังตั้งค่า headers...');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // เพิ่ม x-auth-token header
      axios.defaults.headers.common['x-auth-token'] = token;
      api.defaults.headers.common['x-auth-token'] = token;
      
      console.log('Headers ที่ตั้งค่า:');
      console.log('- Authorization:', `Bearer ${token.substring(0, 10)}...`);
      console.log('- x-auth-token:', `${token.substring(0, 10)}...`);
      
    } catch (error) {
      console.error('Login error', error);
      // ตรวจสอบชนิดของ error และแสดงข้อความที่เหมาะสม
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['Authorization'];
    // ลบ x-auth-token header ด้วย
    delete axios.defaults.headers.common['x-auth-token'];
    delete api.defaults.headers.common['x-auth-token'];
  };

  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      console.log('กำลังรีเฟรชข้อมูลผู้ใช้...');
      
      // เรียก API เพื่อดึงข้อมูลผู้ใช้ปัจจุบัน
      const res = await api.get('/api/auth/me');
      const userData = res.data;
      
      if (!userData) {
        throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
      
      // บันทึกข้อมูลล่าสุดลงใน localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // อัปเดต state
      setUser(userData);
      
      console.log('รีเฟรชข้อมูลผู้ใช้สำเร็จ:', userData);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูลผู้ใช้:', error);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};