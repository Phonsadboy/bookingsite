require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// ตรวจสอบว่ามีการตั้งค่า environment variables ที่จำเป็นหรือไม่
if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({
  limit: '1mb', // จำกัดขนาดข้อมูล JSON
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

// เพิ่ม timeout สำหรับการประมวลผลคำขอ
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 วินาที
  res.setTimeout(30000); // 30 วินาที
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // เพิ่มเวลาในการเลือกเซิร์ฟเวอร์
      socketTimeoutMS: 60000, // เพิ่มเวลาในการรอการเชื่อมต่อ
      family: 4, // ใช้ IPv4 เท่านั้น
      maxPoolSize: 10, // จำกัด connection pool เพื่อประหยัดทรัพยากร
      connectTimeoutMS: 30000, // เพิ่มเวลาในการเชื่อมต่อ
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// จัดการการปิดการเชื่อมต่อก่อนที่โปรแกรมจะจบการทำงาน
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and MongoDB connection...');
  try {
    await new Promise((resolve) => {
      server.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    });
    
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing HTTP server and MongoDB connection...');
  try {
    await new Promise((resolve) => {
      server.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    });
    
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// เพิ่มการจัดการข้อผิดพลาดจาก uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // ไม่ต้อง exit process เพื่อให้แอพยังทำงานต่อได้
  // แต่ต้องบันทึกข้อผิดพลาด
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // ไม่ต้อง exit process เพื่อให้แอพยังทำงานต่อได้
});

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/bookings', require('./routes/bookings'));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/dist'), {
  maxAge: '1d', // เพิ่ม cache สำหรับไฟล์ static
  etag: true,
}));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  console.error('Request URL:', req.originalUrl);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  console.error('Request params:', req.params);
  console.error('Request query:', req.query);
  console.error('Stack trace:', err.stack);
  
  // ตรวจสอบประเภทของข้อผิดพลาดและตอบกลับให้เหมาะสม
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'ข้อมูลไม่ถูกต้อง', 
      error: process.env.NODE_ENV === 'production' ? undefined : err.message 
    });
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ 
      message: 'ข้อมูลซ้ำซ้อน', 
      error: process.env.NODE_ENV === 'production' ? undefined : err.message 
    });
  }
  
  res.status(500).json({ 
    message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์', 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
  });
});

// เพิ่ม garbage collection เพื่อลดการใช้หน่วยความจำ
setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log('Garbage collection executed');
  }
}, 30 * 60 * 1000); // ทุก 30 นาที

const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: Connected`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
});