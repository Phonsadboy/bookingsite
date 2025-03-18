import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, parse } from 'date-fns';
import { th } from 'date-fns/locale';

interface Teacher {
  _id: string;
  name: string;
  profileDescription: string;
  availableSlots: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

interface Booking {
  _id: string;
  teacher: {
    _id: string;
    name: string;
  };
  user: {
    _id: string;
    username: string;
    name: string;
  };
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

interface DateWithBookings {
  date: string;
  formattedDate: string;
  slots: {
    startTime: string;
    endTime: string;
    day: string;
    isBooked: boolean;
    bookingStatus?: string;
    bookingId?: string;
  }[];
}

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [availableDates, setAvailableDates] = useState<DateWithBookings[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get('/api/teachers');
        console.log('ข้อมูลครูที่ได้รับ:', res.data);
        const validTeachers = res.data.filter((teacher: any) => 
          teacher && 
          typeof teacher === 'object' && 
          teacher._id && 
          typeof teacher.name === 'string'
        );
        setTeachers(validTeachers);
        setLoading(false);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลครู:', err);
        setError('ไม่สามารถโหลดรายชื่อครูได้');
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    // ดึงข้อมูลการจองของผู้ใช้เมื่อเข้าสู่ระบบแล้ว
    const fetchUserBookings = async () => {
      if (isAuthenticated) {
        try {
          const res = await axios.get('/api/bookings/my-bookings');
          console.log('ข้อมูลการจองของผู้ใช้:', res.data);
          setBookings(res.data);
        } catch (err) {
          console.error('ไม่สามารถโหลดข้อมูลการจองได้', err);
        }
      }
    };

    fetchUserBookings();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedTeacher) {
      // จัดรูปแบบและจัดกลุ่มวันที่มีคาบเรียนสำหรับครูที่เลือก
      const datesMap = new Map<string, any[]>();
      
      selectedTeacher.availableSlots.forEach(slot => {
        if (!datesMap.has(slot.day)) {
          datesMap.set(slot.day, []);
        }
        
        // ตรวจสอบว่าสล็อตนี้มีการจองโดยผู้ใช้หรือไม่
        const booking = bookings.find(b => 
          b?.teacher?._id === selectedTeacher?._id && 
          b?.day === slot?.day && 
          b?.startTime === slot?.startTime && 
          b?.endTime === slot?.endTime
        );
        
        datesMap.get(slot.day)?.push({
          ...slot,
          isBooked: booking !== undefined,
          bookingStatus: booking?.status,
          bookingId: booking?._id
        });
      });
      
      // เรียงวันที่จากน้อยไปมาก
      const sortedDates = Array.from(datesMap.entries())
        .map(([date, slots]) => ({
          date,
          formattedDate: formatThaiDate(date),
          slots
        }))
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });
      
      setAvailableDates(sortedDates);
    }
  }, [selectedTeacher, bookings]);

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setBookingSuccess(false);
    setBookingError('');
  };

  const handleBookSlot = async (day: string, startTime: string, endTime: string) => {
    if (!selectedTeacher) return;
    
    setBookingError('');
    
    try {
      const res = await axios.post('/api/bookings', {
        teacherId: selectedTeacher._id,
        day,
        date: day, // ใช้ค่าเดียวกับ day
        startTime,
        endTime
      });
      
      console.log('จองสำเร็จ:', res.data);
      
      // เพิ่มการจองใหม่เข้าไปในรายการจอง
      setBookings(prev => [...prev, res.data]);
      
      setBookingSuccess(true);
      
      // รีเซ็ต booking success หลังจาก 5 วินาที
      setTimeout(() => {
        setBookingSuccess(false);
      }, 5000);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'ไม่สามารถจองได้');
    }
  };

  const formatThaiDate = (dateString: string) => {
    try {
      // แปลงจาก 'yyyy-MM-dd' เป็นวันที่แบบไทย
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      return format(date, 'd MMMM yyyy', { locale: th });
    } catch (e) {
      return dateString;
    }
  };

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTeachers = searchTerm 
    ? teachers.filter(t => 
        (t?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (t?.profileDescription?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : teachers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">ครูของเรา</h1>
          <p className="text-indigo-200 max-w-3xl mx-auto">เลือกครูที่คุณสนใจเพื่อดูตารางเวลาและจองคาบเรียน</p>
          
          {/* ส่วนค้นหา */}
          <div className="mt-6 max-w-lg mx-auto">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="ค้นหาครูจากชื่อหรือคำอธิบาย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {bookingSuccess && (
          <div className="rounded-lg bg-green-900/50 border border-green-500/50 text-green-200 p-4 mb-6 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">จองคาบเรียนสำเร็จ!</span>
            </div>
            <p className="text-sm">กรุณารอการยืนยันจากผู้ดูแลระบบ คุณสามารถตรวจสอบสถานะการจองได้ที่หน้า "การจองของฉัน"</p>
          </div>
        )}

        {bookingError && (
          <div className="rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 p-4 mb-6 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">ไม่สามารถจองได้</span>
            </div>
            <p className="text-sm">{bookingError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <div 
                  key={teacher._id} 
                  className={`rounded-xl overflow-hidden shadow-md ${
                    selectedTeacher?._id === teacher._id 
                      ? 'bg-white/20 ring-2 ring-pink-500 border border-transparent' 
                      : 'bg-white/10 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => handleSelectTeacher(teacher)}
                  >
                    <h2 className="text-xl font-semibold mb-2">{teacher?.name || 'ไม่ระบุชื่อ'}</h2>
                    <p className="text-indigo-200 text-sm mb-4">{teacher?.profileDescription || 'ไม่มีคำอธิบาย'}</p>
                    <div className="flex items-center text-xs text-indigo-300">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{teacher?.availableSlots?.length || 0} ช่วงเวลาสอน</span>
                    </div>
                  </div>
                  
                  {selectedTeacher?._id === teacher._id && (
                    <div className="p-6 bg-black/20 border-t border-white/10">
                      <h3 className="text-lg font-medium mb-4">ตารางเวลาสอน</h3>
                      
                      {availableDates.length > 0 ? (
                        <div className="space-y-4">
                          {availableDates.map((dateObj) => (
                            <div key={dateObj.date} className="bg-white/5 rounded-lg p-4">
                              <div className="font-medium mb-3">{dateObj.formattedDate}</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {dateObj.slots.map((slot, idx) => {
                                  const isUserBooking = slot.isBooked;
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`rounded-lg p-3 ${
                                        isUserBooking
                                          ? slot.bookingStatus === 'pending'
                                            ? 'bg-yellow-900/20 border border-yellow-500/30'
                                            : slot.bookingStatus === 'confirmed'
                                              ? 'bg-green-900/20 border border-green-500/30'
                                              : slot.bookingStatus === 'completed'
                                                ? 'bg-blue-900/20 border border-blue-500/30'
                                                : 'bg-red-900/20 border border-red-500/30'
                                          : 'bg-indigo-900/20 border border-indigo-500/30'
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium">
                                          {slot.startTime} - {slot.endTime}
                                        </div>
                                        {isUserBooking && (
                                          <div className={`px-2 py-1 text-xs rounded-full ${getBookingStatusColor(slot.bookingStatus || 'pending')}/20 text-white`}>
                                            {getBookingStatusText(slot.bookingStatus || 'pending')}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {isUserBooking ? (
                                        <div className="text-sm flex items-center text-indigo-200">
                                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          คุณได้จองคาบเรียนนี้แล้ว
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handleBookSlot(slot.day, slot.startTime, slot.endTime)}
                                          disabled={!isAuthenticated}
                                          className={`w-full text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isAuthenticated
                                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                                              : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                          }`}
                                        >
                                          {isAuthenticated ? 'จองคาบเรียน' : 'กรุณาเข้าสู่ระบบ'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-indigo-300">
                          <svg className="mx-auto h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2">ไม่มีคาบเรียนที่ว่าง</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <svg className="mx-auto h-12 w-12 text-indigo-400 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium">ไม่พบครูที่ตรงกับการค้นหา</h3>
                <p className="mt-2 text-indigo-300">ลองค้นหาด้วยคำอื่น หรือล้างการค้นหา</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="mt-4 px-4 py-2 border border-indigo-500 rounded-lg text-indigo-300 hover:bg-indigo-900/30"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers; 