const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  }
});

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  profileDescription: {
    type: String,
    required: true
  },
  availableSlots: [slotSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);