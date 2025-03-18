require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    // เชื่อมต่อกับ MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');

    // เช็คว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    const existingUser = await User.findOne({ username: 'pp1234' });
    if (existingUser) {
      // อัพเดตให้เป็นแอดมินถ้ามีผู้ใช้นี้อยู่แล้ว
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('อัพเดตผู้ใช้ pp1234 เป็นแอดมินสำเร็จ');
    } else {
      // สร้างผู้ใช้ใหม่ถ้ายังไม่มี
      const hashedPassword = await bcrypt.hash('pp1234', 10);
      const newAdmin = new User({
        username: 'pp1234',
        password: hashedPassword,
        role: 'admin',
        totalLessons: 999, // จำนวนบทเรียนทั้งหมด
        usedLessons: 0
      });

      await newAdmin.save();
      console.log('สร้างผู้ใช้แอดมิน pp1234 สำเร็จ');
    }

    // ปิดการเชื่อมต่อ
    await mongoose.connection.close();
    console.log('ปิดการเชื่อมต่อกับ MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
};

createAdmin(); 