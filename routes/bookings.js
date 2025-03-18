const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all bookings for admin
router.get('/all', adminAuth, async (req, res) => {
  try {
    // ดึงข้อมูลการจองทั้งหมดพร้อมกับข้อมูลครูและผู้ใช้
    const bookings = await Booking.find()
      .populate('teacher', 'name')
      .populate('user', 'username name');
    
    console.log('ส่งข้อมูลการจองทั้งหมด:', bookings.length, 'รายการ');
    res.json(bookings);
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลการจอง:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const { teacherId, day, date, startTime, endTime } = req.body;
    
    // ในกรณีที่ admin ทำการจองให้ผู้ใช้ ให้ใช้ userId ที่ส่งมา แต่ถ้าเป็นผู้ใช้ทั่วไป ใช้ userId จาก token
    const userId = req.body.userId && req.user.role === 'admin' ? req.body.userId : req.user.userId;
    
    // ตรวจสอบว่ามีการจองในช่วงเวลานี้แล้วหรือไม่
    const existingBooking = await Booking.findOne({
      teacher: teacherId,
      day,
      startTime,
      endTime,
      status: { $ne: 'cancelled' } // ไม่นับการจองที่ถูกยกเลิกแล้ว
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'ช่วงเวลานี้ถูกจองไปแล้ว' });
    }
    
    // ตรวจสอบว่าผู้ใช้มีคาบเหลือพอหรือไม่
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    // คำนวณจำนวนคาบที่ใช้ไปแล้ว
    if (user.usedLessons >= user.totalLessons && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'คุณใช้คาบเรียนหมดแล้ว' });
    }
    
    // สร้างการจองใหม่
    const booking = new Booking({
      user: userId,
      teacher: teacherId,
      day,
      date,
      startTime,
      endTime,
      status: 'pending'
    });
    
    await booking.save();
    
    // อัพเดทจำนวนคาบที่ใช้ไป เว้นแต่เป็น admin ที่สร้างการจอง
    if (req.user.role !== 'admin') {
      user.usedLessons = (user.usedLessons || 0) + 1;
      await user.save();
    }
    
    // ส่งข้อมูลการจองกลับไป
    const populatedBooking = await Booking.findById(booking._id)
      .populate('teacher', 'name')
      .populate('user', 'username name');
    
    console.log('สร้างการจองใหม่:', {
      id: booking._id,
      teacher: teacherId,
      user: userId,
      day,
      time: `${startTime}-${endTime}`,
      status: 'pending'
    });
    
    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการสร้างการจอง:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // ตรวจสอบสถานะที่ส่งมา
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }
    
    // ค้นหาและอัพเดทการจอง
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบการจอง' });
    }
    
    // ตรวจสอบถ้าเป็นการยกเลิกการจอง ให้คืนคาบเรียนให้กับผู้ใช้
    if (status === 'cancelled' && booking.status !== 'cancelled') {
      const user = await User.findById(booking.user);
      if (user && user.usedLessons > 0) {
        user.usedLessons -= 1;
        await user.save();
      }
    }
    
    booking.status = status;
    await booking.save();
    
    console.log('อัพเดทสถานะการจอง:', {
      id: booking._id, 
      status,
      user: booking.user,
      teacher: booking.teacher
    });
    
    // ส่งข้อมูลการจองที่อัพเดทแล้วกลับไป
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('user', 'username name');
    
    res.json(updatedBooking);
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการจอง:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a booking
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบการจอง' });
    }
    
    // คืนคาบเรียนให้กับผู้ใช้ก่อนลบการจอง
    if (booking.status !== 'cancelled') {
      const user = await User.findById(booking.user);
      if (user && user.usedLessons > 0) {
        user.usedLessons -= 1;
        await user.save();
      }
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    
    console.log('ลบการจอง:', {
      id: req.params.id,
      user: booking.user,
      teacher: booking.teacher
    });
    
    res.json({ message: 'ลบการจองเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการลบการจอง:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;