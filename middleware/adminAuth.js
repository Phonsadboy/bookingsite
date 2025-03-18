const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware for admin-only routes
module.exports = function(req, res, next) {
  try {
    // แสดงข้อมูล debug เพื่อตรวจสอบเฮดเดอร์ทั้งหมด
    console.log('=== เฮดเดอร์ทั้งหมดที่ได้รับ ===');
    console.log('Authorization:', req.header('Authorization'));
    console.log('x-auth-token:', req.header('x-auth-token'));
    console.log('===========================');
    
    // ตรวจสอบ token จากทั้งเฮดเดอร์ Authorization และ x-auth-token
    let token;
    
    // ตรวจสอบจาก Authorization header ก่อน (Bearer token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('ใช้ token จาก Authorization header');
    } 
    // ถ้าไม่มี ให้ตรวจสอบจาก x-auth-token
    else if (req.header('x-auth-token')) {
      token = req.header('x-auth-token');
      console.log('ใช้ token จาก x-auth-token header');
    }
    
    // ถ้าไม่พบ token จากทั้งสองที่
    if (!token) {
      console.log('Admin auth failed: No token provided');
      return res.status(401).json({ message: 'ไม่พบ token สำหรับการยืนยันตัวตน กรุณาล็อกอินใหม่' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      console.log('Token ถูกถอดรหัสสำเร็จ:', {
        userId: decoded.userId,
        role: decoded.role
      });
      
      // ตรวจสอบว่าผู้ใช้มีสิทธิ์ admin หรือไม่
      if (decoded.role !== 'admin') {
        console.log('Admin auth failed: User is not admin. Role:', decoded.role);
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
      }
      
      console.log('Admin auth passed for user:', decoded.userId);
      next();
    } catch (err) {
      console.error('Admin auth failed: Invalid token:', err.message);
      res.status(401).json({ message: 'Token ไม่ถูกต้อง กรุณาล็อกอินใหม่' });
    }
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};