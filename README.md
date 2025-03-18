# ระบบจองครูสอน AI (BookingAI)

## รายละเอียดโครงการ
ระบบจองครูสอน AI เป็นแพลตฟอร์มสำหรับการจองเวลาเรียนกับครูที่เชี่ยวชาญด้าน AI โดยมีระบบจัดการการจองเวลา, ข้อมูลครู และผู้ใช้งาน พัฒนาด้วย MERN Stack (MongoDB, Express, React, Node.js)

## คุณสมบัติหลัก
- ระบบสมาชิก (ลงทะเบียน/เข้าสู่ระบบ)
- ระบบจัดการข้อมูลครู
- ระบบจองเวลาเรียน
- ส่วนผู้ดูแลระบบสำหรับจัดการข้อมูล

## เทคโนโลยีที่ใช้

### Backend
- Node.js (v18+)
- Express.js
- MongoDB (Mongoose)
- JSON Web Token (JWT) สำหรับการรับรองตัวตน
- bcrypt สำหรับการเข้ารหัสพาสเวิร์ด

### Frontend
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Headless UI
- Heroicons
- Axios

## การติดตั้ง

### ความต้องการเบื้องต้น
- Node.js ≥ 18.0.0
- MongoDB (ใช้ MongoDB Atlas หรือติดตั้งเองก็ได้)
- npm หรือ yarn

### ขั้นตอนการติดตั้ง

1. โคลนโปรเจค
```
git clone <repository-url>
cd bookingai
```

2. ติดตั้ง dependencies สำหรับ server
```
npm install
```

3. ติดตั้ง dependencies สำหรับ client
```
cd client
npm install
cd ..
```

4. สร้างไฟล์ .env
คัดลอกไฟล์ .env.example เป็น .env และกำหนดค่าต่างๆ
```
cp .env.example .env
```

แก้ไขไฟล์ .env และกำหนดค่าต่อไปนี้:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_jwt_secret_key_should_be_long_and_complex
PORT=5002
NODE_ENV=development
```

5. สร้างผู้ดูแลระบบ (admin)
```
node create-admin.js
```

## การเริ่มต้นใช้งาน

### โหมดพัฒนา (Development)

1. เริ่ม Backend server
```
npm run dev
```

2. เริ่ม Frontend server (ในอีกเทอร์มินัลหนึ่ง)
```
npm run client
```

สามารถเข้าถึงแอปพลิเคชันได้ที่ http://localhost:5173

### โหมดการใช้งานจริง (Production)

1. สร้าง production build ของ frontend
```
npm run build
```

2. เริ่มต้นเซิร์ฟเวอร์
```
npm start
```

เข้าถึงแอปพลิเคชันได้ที่ http://localhost:5002

## โครงสร้างโปรเจค

```
bookingai/
├── client/                # Frontend React application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   ├── dist/              # Built frontend (production)
│   ├── package.json       # Frontend dependencies
│   └── ...
├── middleware/            # Express middleware
├── models/                # Mongoose models
│   ├── Booking.js         # Booking model
│   ├── Teacher.js         # Teacher model
│   └── User.js            # User model
├── routes/                # API routes
│   ├── auth.js            # Authentication routes
│   ├── bookings.js        # Booking management routes
│   └── teachers.js        # Teacher management routes
├── .env                   # Environment variables
├── .env.example           # Example environment variables
├── create-admin.js        # Script to create admin user
├── package.json           # Backend dependencies
├── Procfile               # Heroku deployment file
└── server.js              # Main application file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิกใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน

### ครู
- `GET /api/teachers` - ดึงรายการครูทั้งหมด
- `GET /api/teachers/:id` - ดึงข้อมูลครูตาม ID
- `POST /api/teachers` - เพิ่มครูใหม่ (admin เท่านั้น)
- `PUT /api/teachers/:id` - อัปเดตข้อมูลครู (admin เท่านั้น)
- `DELETE /api/teachers/:id` - ลบครู (admin เท่านั้น)

### การจอง
- `GET /api/bookings` - ดึงรายการจองของผู้ใช้ปัจจุบัน
- `GET /api/bookings/all` - ดึงรายการจองทั้งหมด (admin เท่านั้น)
- `POST /api/bookings` - สร้างการจองใหม่
- `PUT /api/bookings/:id` - อัปเดตการจอง
- `DELETE /api/bookings/:id` - ยกเลิกการจอง

## การสร้างผู้ดูแลระบบ

ใช้สคริปต์ `create-admin.js` เพื่อสร้างบัญชีผู้ดูแลระบบ:

```
node create-admin.js
```

## การปรับใช้งาน (Deployment)

โปรเจคนี้มีการกำหนดค่าสำหรับการ deploy บน Heroku แล้ว (ผ่าน Procfile) หรือสามารถ deploy บนแพลตฟอร์ม cloud อื่นๆ เช่น Railway หรือ Render ได้

### ขั้นตอนการ Deploy บน Heroku

1. สร้าง Heroku app
```
heroku create your-app-name
```

2. เพิ่ม MongoDB URI ใน Heroku Config Vars
```
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set NODE_ENV=production
```

3. Push โค้ดไปยัง Heroku
```
git push heroku main
```

## การดูแลรักษา

- การสำรองข้อมูล: แนะนำให้ตั้งค่าการสำรองข้อมูลอัตโนมัติสำหรับ MongoDB database
- การอัปเดต dependencies: ตรวจสอบและอัปเดต dependencies เป็นประจำเพื่อความปลอดภัย
- การตรวจสอบ logs: เพื่อติดตามปัญหาและประสิทธิภาพของระบบ

## ลิขสิทธิ์

© 2023 BookingAI - สงวนลิขสิทธิ์ 