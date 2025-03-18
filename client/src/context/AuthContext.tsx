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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // เพิ่ม x-auth-token header
      axios.defaults.headers.common['x-auth-token'] = token;
      api.defaults.headers.common['x-auth-token'] = token;
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

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};