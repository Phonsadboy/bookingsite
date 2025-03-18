const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // ตรวจสอบ token จากทั้งเฮดเดอร์ Authorization และ x-auth-token
    let token;
    
    // ตรวจสอบจาก Authorization header ก่อน (Bearer token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } 
    // ถ้าไม่มี ให้ตรวจสอบจาก x-auth-token
    else if (req.header('x-auth-token')) {
      token = req.header('x-auth-token');
    }
    
    // ถ้าไม่พบ token จากทั้งสองที่
    if (!token) {
      return res.status(401).json({ message: 'ไม่พบ token สำหรับการยืนยันตัวตน กรุณาล็อกอินใหม่' });
    }
    
    // ตรวจสอบความถูกต้องของ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'การยืนยันตัวตนล้มเหลว กรุณาล็อกอินใหม่' });
  }
};