require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/bookings', require('./routes/bookings'));

// เช็คว่ามีโฟลเดอร์ client/dist หรือไม่
const distPath = path.join(__dirname, 'client/dist');
const hasClientBuild = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

// ถ้ามี frontend build ไฟล์ จึงจะ serve
if (hasClientBuild) {
  console.log('Frontend build found, serving static files');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('No frontend build found, API only mode');
  // API welcome route
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to BookingAI API. Frontend is not available in this deployment.' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  console.error('Request body:', req.body);
  console.error('Request params:', req.params);
  console.error('Request query:', req.query);
  console.error('Stack trace:', err.stack);
  
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});