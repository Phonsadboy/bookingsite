import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  adminOnly = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // แสดง loading component ระหว่างตรวจสอบสถานะการเข้าสู่ระบบ
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 border-opacity-20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
            <span className="text-white text-lg font-medium">AI</span>
          </div>
        </div>
      </div>
    );
  }

  // สำหรับเส้นทางที่ต้องการการยืนยันตัวตน
  if (requireAuth && !isAuthenticated) {
    // ถ้ายังไม่เข้าสู่ระบบ ให้ redirect ไปที่หน้า login พร้อมบันทึกเส้นทางที่พยายามเข้าถึง
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // สำหรับเส้นทางที่อนุญาตเฉพาะผู้ดูแลระบบ
  if (adminOnly && user?.role !== 'admin') {
    // ถ้าไม่ใช่ผู้ดูแลระบบ ให้ redirect ไปที่หน้าหลัก
    return <Navigate to="/" replace />;
  }

  // สำหรับเส้นทางที่ผู้ใช้ที่เข้าสู่ระบบแล้วไม่ควรเข้าถึง (เช่น หน้า login)
  if (!requireAuth && isAuthenticated) {
    // ถ้าเข้าสู่ระบบแล้ว ให้ redirect ไปที่หน้าหลัก
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 