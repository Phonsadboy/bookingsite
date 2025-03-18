const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    // ตรวจสอบว่าได้รับข้อมูลครบหรือไม่
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน' });
    }
    
    const { username, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    console.log('User found:', user.username);
    console.log('Password comparison:', password, user.password);
    
    // Validate password โดยการเทียบโดยตรง ไม่ต้องใช้ bcrypt
    if (password !== user.password) {
      console.log('Password mismatch');
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    console.log('Login successful');
    
    // Create and return JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'การตั้งค่าเซิร์ฟเวอร์ไม่ถูกต้อง' });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        totalLessons: user.totalLessons,
        usedLessons: user.usedLessons
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Admin route to create new user
router.post('/register', adminAuth, async (req, res) => {
  try {
    const { username, password, totalLessons, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password,  // ไม่ต้องแฮชรหัสผ่าน
      name: name || '',
      totalLessons: totalLessons || 0
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        totalLessons: user.totalLessons
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    console.log('กำลังดึงข้อมูลผู้ใช้ทั้งหมดสำหรับแอดมิน (user ID:', req.user.userId, ')');
    const users = await User.find();
    console.log('พบผู้ใช้ทั้งหมด', users.length, 'คน');
    
    // เพิ่มข้อมูล debug
    if (users.length === 0) {
      console.log('ไม่พบข้อมูลผู้ใช้ในระบบ');
    } else {
      console.log('ตัวอย่างข้อมูลผู้ใช้แรก:', {
        _id: users[0]._id,
        username: users[0].username,
        role: users[0].role
      });
    }
    
    res.json(users);
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ทั้งหมด:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to get a single user by ID
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to update user lessons
router.put('/users/:userId/lessons', adminAuth, async (req, res) => {
  try {
    const { totalLessons } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { totalLessons },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to update user details
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { username, name, totalLessons, role, password } = req.body;
    const updateData = { username, name, totalLessons, role };
    
    // อัพเดตรหัสผ่านโดยตรง ไม่ต้องแฮช
    if (password) {
      updateData.password = password;
    }
    
    // กรองข้อมูลที่เป็น undefined ออก
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;