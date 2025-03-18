require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// ข้อมูลแอดมิน - คุณสามารถแก้ไขได้ตามต้องการ
const adminInfo = {
  username: 'admin',  // เปลี่ยนชื่อผู้ใช้
  password: 'admin123',  // เปลี่ยนรหัสผ่าน
  role: 'admin',
  totalLessons: 999,
  usedLessons: 0,
  name: 'ผู้ดูแลระบบ'  // เปลี่ยนชื่อ
};

console.log('เริ่มต้นการสร้างแอดมิน...');
console.log('กำลังใช้ข้อมูล:', { 
  username: adminInfo.username, 
  role: adminInfo.role,
  name: adminInfo.name
});

const createAdmin = async () => {
  try {
    console.log('กำลังเชื่อมต่อกับ MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'มีการกำหนดค่าแล้ว' : 'ไม่มีการกำหนดค่า');
    
    // เชื่อมต่อกับ MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');

    // เช็คว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    console.log('กำลังตรวจสอบผู้ใช้...');
    const existingUser = await User.findOne({ username: adminInfo.username });
    
    if (existingUser) {
      console.log(`พบผู้ใช้ ${adminInfo.username} อยู่แล้ว, กำลังอัพเดตเป็นแอดมิน...`);
      // อัพเดตข้อมูลถ้ามีผู้ใช้นี้อยู่แล้ว
      existingUser.role = adminInfo.role;
      existingUser.password = adminInfo.password; // เก็บรหัสผ่านโดยตรง ไม่ใช้ bcrypt
      existingUser.totalLessons = adminInfo.totalLessons;
      existingUser.name = adminInfo.name;
      await existingUser.save();
      console.log(`อัพเดตผู้ใช้ ${adminInfo.username} เป็นแอดมินสำเร็จ`);
    } else {
      console.log(`ไม่พบผู้ใช้ ${adminInfo.username}, กำลังสร้างผู้ใช้ใหม่...`);
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
    
    console.log('===== การสร้างแอดมินเสร็จสมบูรณ์ =====');
    console.log('ชื่อผู้ใช้:', adminInfo.username);
    console.log('รหัสผ่าน:', adminInfo.password);
    console.log('ตอนนี้คุณสามารถเข้าสู่ระบบด้วยบัญชีนี้ได้แล้ว');
    
    process.exit(0);
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

createAdmin(); 