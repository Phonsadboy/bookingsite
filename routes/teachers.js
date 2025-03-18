const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single teacher
router.get('/:id', async (req, res) => {
  try {
    console.log('กำลังดึงข้อมูลครู:', req.params.id);
    const teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      console.log('ไม่พบข้อมูลครู:', req.params.id);
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    console.log('ดึงข้อมูลครูสำเร็จ:', teacher.name, 'จำนวนช่วงเวลา:', teacher.availableSlots?.length || 0);
    res.json(teacher);
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลครู:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create teacher (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, profileDescription, availableSlots } = req.body;

    const teacher = new Teacher({
      name,
      profileDescription,
      availableSlots: availableSlots || []
    });

    await teacher.save();
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update teacher (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, profileDescription, availableSlots } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    teacher.name = name || teacher.name;
    teacher.profileDescription = profileDescription || teacher.profileDescription;
    if (availableSlots) {
      teacher.availableSlots = availableSlots;
    }

    await teacher.save();
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add slot (admin only)
router.post('/:id/slots', adminAuth, async (req, res) => {
  try {
    const { day, startTime, endTime } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!teacher.availableSlots) {
      teacher.availableSlots = [];
    }

    teacher.availableSlots.push({
      day,
      startTime,
      endTime
    });

    await teacher.save();
    res.json(teacher);
  } catch (err) {
    console.error('Error in adding slot:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete slot (admin only)
router.delete('/:id/slots/:slotIndex', adminAuth, async (req, res) => {
  try {
    const { id, slotIndex } = req.params;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!teacher.availableSlots || slotIndex >= teacher.availableSlots.length) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    teacher.availableSlots.splice(parseInt(slotIndex), 1);
    await teacher.save();
    res.json(teacher);
  } catch (err) {
    console.error('Error in deleting slot:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    await teacher.deleteOne();
    res.json({ message: 'Teacher removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;