import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// เพิ่มประเภทข้อมูลสำหรับ user
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  totalLessons: number;
  usedLessons: number;
}

// เพิ่ม interface ให้กับ slot
interface Slot {
  _id: string;
  day: string;
  time: string;
  teacher: {
    _id: string;
    name: string;
  };
}

const BookingCalendar = () => {
  const { isAuthenticated } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const scheduleResponse = await axios.get('/api/schedule');
        setSchedule(scheduleResponse.data);
        console.log('ตารางสอน:', scheduleResponse.data);

        // ดึงข้อมูลผู้ใช้เพื่อแสดงจำนวนคาบที่เหลือ
        const userRes = await axios.get('/api/auth/me');
        setUser(userRes.data);

        setLoading(false);
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // เพิ่มการตรวจสอบว่ามีคาบเรียนเหลือพอสำหรับการจองหรือไม่
  const handleBookingClick = (slot: Slot) => {
    if (!isAuthenticated) {
      setAlertMessage({
        type: 'error',
        text: 'กรุณาเข้าสู่ระบบก่อนทำการจอง',
      });
      setShowAlert(true);
      return;
    }

    // ตรวจสอบจำนวนคาบที่เหลือ
    const remainingLessons = (user?.totalLessons || 0) - (user?.usedLessons || 0);
    if (remainingLessons <= 0) {
      setAlertMessage({
        type: 'error',
        text: 'คาบเรียนของคุณหมดแล้ว ไม่สามารถจองเพิ่มได้',
      });
      setShowAlert(true);
      return;
    }

    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedSlot(null);
  };

  const handleBookConfirm = async () => {
    try {
      if (!selectedSlot) return;

      const response = await axios.post('/api/bookings', {
        teacherId: selectedSlot.teacher._id,
        day: selectedSlot.day,
        time: selectedSlot.time,
      });

      if (response.status === 201) {
        setAlertMessage({
          type: 'success',
          text: 'จองเรียนสำเร็จ',
        });
        setShowAlert(true);
        closeBookingModal();
        
        // รีเฟรชข้อมูลผู้ใช้เพื่ออัปเดตจำนวนคาบที่เหลือ
        const userRes = await axios.get('/api/auth/me');
        setUser(userRes.data);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการจอง:', error);
      setAlertMessage({
        type: 'error',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่',
      });
      setShowAlert(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6">ปฏิทินการจอง</h1>
      
      {/* เพิ่มส่วนแสดงจำนวนคาบเรียน */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">จำนวนคาบเรียนของคุณ</h2>
          
          <div className="mt-4 md:mt-0 flex space-x-4">
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600">คาบเรียนทั้งหมด</p>
              <p className="text-xl font-bold text-gray-800">{user?.totalLessons || 0}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600">ใช้ไปแล้ว</p>
              <p className="text-xl font-bold text-gray-800">{user?.usedLessons || 0}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg border border-indigo-300 text-center">
              <p className="text-sm text-gray-600">คงเหลือ</p>
              <p className="text-xl font-bold text-indigo-600">{(user?.totalLessons || 0) - (user?.usedLessons || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ 
                width: `${user?.totalLessons ? (user.usedLessons / user.totalLessons) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0</span>
            <span>{user?.totalLessons || 0} คาบ</span>
          </div>
        </div>
      </div>
      
      {/* ตารางเวลา */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">ตารางเวลา</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วัน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ครูผู้สอน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การจอง</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((slot) => (
                  <tr key={slot._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.teacher.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {slot.isBooked ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">จองแล้ว</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">ว่าง</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!slot.isBooked && (
                        <button
                          onClick={() => handleBookingClick(slot)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          จองคาบเรียน
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal สำหรับการจอง */}
      {isBookingModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">ยืนยันการจอง</h2>
            <p className="mb-4">
              คุณต้องการจองคาบเรียนกับ <span className="font-medium">{selectedSlot.teacher.name}</span> ในวัน{' '}
              <span className="font-medium">{selectedSlot.day}</span> เวลา{' '}
              <span className="font-medium">{selectedSlot.time}</span> ใช่หรือไม่?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeBookingModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBookConfirm}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                ยืนยันการจอง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* แสดงข้อความแจ้งเตือน */}
      {showAlert && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          alertMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {alertMessage.type === 'success' ? '✓' : '✗'}
            </span>
            <p>{alertMessage.text}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar; 