import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Slot {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface Teacher {
  _id: string;
  name: string;
  profileDescription: string;
  availableSlots: Slot[];
}

const dayTranslation: { [key: string]: string } = {
  'Monday': 'วันจันทร์',
  'Tuesday': 'วันอังคาร',
  'Wednesday': 'วันพุธ',
  'Thursday': 'วันพฤหัสบดี',
  'Friday': 'วันศุกร์',
  'Saturday': 'วันเสาร์',
  'Sunday': 'วันอาทิตย์'
};

// Utility function to format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('th-TH', options);
};

const TeacherDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(selectedSlot && selectedSlot._id === slot._id ? null : slot);
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await axios.get(`/api/teachers/${id}`);
        setTeacher(res.data);
        setLoading(false);
      } catch (err: any) {
        setError('ไม่สามารถโหลดข้อมูลครูได้');
        setLoading(false);
      }
    };

    if (id) {
      fetchTeacher();
    }
  }, [id]);

  const handleBooking = async () => {
    if (!selectedSlot) return;

    try {
      setBookingError('');
      setBookingSuccess(false);

      // Check if user has available lessons
      if (user && user.usedLessons >= user.totalLessons) {
        setBookingError('คุณไม่มีคาบเรียนเหลือแล้ว');
        return;
      }

      const response = await axios.post('/api/bookings', {
        teacherId: teacher?._id,
        day: selectedSlot.day,
        date: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });

      console.log('การจองสำเร็จ:', response.data);
      
      setBookingSuccess(true);
      setSelectedSlot(null);

      // Refresh teacher data to update availability
      const res = await axios.get(`/api/teachers/${id}`);
      setTeacher(res.data);
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการจอง:', err);
      let errorMessage = 'การจองไม่สำเร็จ';
      
      if (err.response) {
        // ดึงข้อความจาก response ของ server
        errorMessage = err.response.data?.message || errorMessage;
        console.error('Server response:', err.response.data);
      }
      
      setBookingError(errorMessage);
    }
  };

  const groupSlotsByDay = (slots: Slot[]) => {
    const grouped: Record<string, Slot[]> = {};
    
    slots.forEach(slot => {
      if (!slot.isBooked) {
        if (!grouped[slot.day]) {
          grouped[slot.day] = [];
        }
        grouped[slot.day].push(slot);
      }
    });
    
    return grouped;
  };

  if (loading) return <div className="min-h-screen bg-indigo-900 flex justify-center items-center text-white">กำลังโหลด...</div>;
  if (error) return <div className="min-h-screen bg-indigo-900 flex justify-center items-center text-white">{error}</div>;
  if (!teacher) return <div className="min-h-screen bg-indigo-900 flex justify-center items-center text-white">ไม่พบข้อมูลครู</div>;

  const availableSlotsByDay = groupSlotsByDay(teacher.availableSlots || []);
  const hasAvailableSlots = Object.keys(availableSlotsByDay).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Teacher info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-900">{teacher.name}</h2>
                    <p className="text-sm text-indigo-600">ครูผู้สอน</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">รายละเอียด</h3>
                  <div className="text-gray-600 text-base">
                    <p>{teacher.profileDescription}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/teachers')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    กลับไปหน้ารายชื่อครู
                  </button>
                </div>
              </div>
            </div>

            {/* Booking Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">ตารางเวลาว่าง</h3>
                
                {bookingSuccess && (
                  <div className="mb-6 rounded-md bg-green-50 p-4 animate-pulse">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">จองเรียบร้อยแล้ว!</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>คุณได้จองคาบเรียนเรียบร้อยแล้ว สามารถดูได้ในรายการจองของคุณ</p>
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => navigate('/my-bookings')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            ดูการจองของฉัน
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="mb-6 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{bookingError}</h3>
                      </div>
                    </div>
                  </div>
                )}

                {hasAvailableSlots ? (
                  <div className="mt-4 space-y-6">
                    {Object.keys(availableSlotsByDay).map(day => (
                      <div key={day} className="border-b pb-5 last:border-b-0">
                        <h3 className="text-lg font-medium text-indigo-700 mb-3">{dayTranslation[day] || day}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {availableSlotsByDay[day].map(slot => (
                            <button
                              key={slot._id}
                              onClick={() => isAuthenticated && !slot.isBooked && handleSlotSelect(slot)}
                              disabled={slot.isBooked || !isAuthenticated}
                              className={`
                                px-3 py-2 text-sm rounded-md transition-all duration-200
                                ${slot.isBooked 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : selectedSlot?._id === slot._id 
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transform -translate-y-1' 
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'
                                }
                                ${!isAuthenticated && !slot.isBooked ? 'opacity-75 cursor-not-allowed' : ''}
                              `}
                            >
                              {slot.startTime} - {slot.endTime}
                              {slot.isBooked && <span className="block text-xs mt-1">(จองแล้ว)</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500">ไม่มีเวลาว่างในขณะนี้</p>
                  </div>
                )}

                {selectedSlot && isAuthenticated && (
                  <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h4 className="text-indigo-800 font-medium mb-2">ยืนยันการจอง</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      คุณกำลังจะจอง <span className="font-medium">{dayTranslation[selectedSlot.day] || selectedSlot.day}</span> เวลา <span className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</span> กับครู <span className="font-medium">{teacher.name}</span>
                    </p>
                    <button
                      onClick={handleBooking}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      ยืนยันการจอง
                    </button>
                  </div>
                )}

                {/* แสดงผลเวลาว่างทั้งหมดของครู */}
                {hasAvailableSlots && (
                  <div className="mt-8 border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900">เลือกเวลาที่ต้องการเรียน</h3>
                    
                    {!selectedSlot && (
                      <div className="grid grid-cols-1 mt-5 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(availableSlotsByDay).map(([day, slots]) => (
                          <div key={day} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                              <h4 className="text-base font-medium text-gray-900 mb-4">{dayTranslation[day] || day}</h4>
                              <div className="space-y-3">
                                {slots.map((slot) => (
                                  <button
                                    key={slot._id}
                                    onClick={() => handleSlotSelect(slot)}
                                    disabled={slot.isBooked}
                                    className={`w-full flex justify-between items-center px-4 py-2 border ${
                                      slot.isBooked 
                                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                                        : 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    } rounded-md transition-colors duration-150`}
                                  >
                                    <span>{slot.startTime} - {slot.endTime}</span>
                                    {slot.isBooked ? (
                                      <span className="text-xs font-medium bg-gray-100 text-gray-800 py-1 px-2 rounded-full">จองแล้ว</span>
                                    ) : (
                                      <span className="text-xs font-medium bg-green-100 text-green-800 py-1 px-2 rounded-full">ว่าง</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* แสดงเฉพาะกรณีมีการเลือกช่วงเวลาแล้ว */}
                    {selectedSlot && (
                      <div className="mt-5 bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <h4 className="text-base font-medium text-gray-900 mb-4">{dayTranslation[selectedSlot.day] || selectedSlot.day}</h4>
                          <div className="space-y-3">
                            {availableSlotsByDay[selectedSlot.day].map((slot) => (
                              <button
                                key={slot._id}
                                onClick={() => handleSlotSelect(slot)}
                                disabled={slot.isBooked}
                                className={`w-full flex justify-between items-center px-4 py-2 border ${
                                  slot.isBooked 
                                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                                    : 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                } rounded-md transition-colors duration-150`}
                              >
                                <span>{slot.startTime} - {slot.endTime}</span>
                                {slot.isBooked ? (
                                  <span className="text-xs font-medium bg-gray-100 text-gray-800 py-1 px-2 rounded-full">จองแล้ว</span>
                                ) : (
                                  <span className="text-xs font-medium bg-green-100 text-green-800 py-1 px-2 rounded-full">ว่าง</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetail;