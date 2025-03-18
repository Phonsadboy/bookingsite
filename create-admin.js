require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const adminInfo = {
  username: 'pp1234',
  password: 'pp1234',
  role: 'admin',
  totalLessons: 999,
  usedLessons: 0,
  name: 'Admin User'
};

const createAdmin = async () => {
  try {
    // เชื่อมต่อกับ MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');

    // เช็คว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    const existingUser = await User.findOne({ username: adminInfo.username });
    if (existingUser) {
      // อัพเดตข้อมูลถ้ามีผู้ใช้นี้อยู่แล้ว
      existingUser.role = adminInfo.role;
      existingUser.password = adminInfo.password; // เก็บรหัสผ่านโดยตรง ไม่ใช้ bcrypt
      existingUser.totalLessons = adminInfo.totalLessons;
      existingUser.name = adminInfo.name;
      await existingUser.save();
      console.log(`อัพเดตผู้ใช้ ${adminInfo.username} เป็นแอดมินสำเร็จ`);
    } else {
      // สร้างผู้ใช้ใหม่ถ้ายังไม่มี
      const newAdmin = new User({
        username: adminInfo.username,
        password: adminInfo.password, // เก็บรหัสผ่านโดยตรง ไม่ใช้ bcrypt
        role: adminInfo.role,
        totalLessons: adminInfo.totalLessons,
        usedLessons: adminInfo.usedLessons,
        name: adminInfo.name
      });

      await newAdmin.save();
      console.log(`สร้างผู้ใช้แอดมิน ${adminInfo.username} สำเร็จ`);
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