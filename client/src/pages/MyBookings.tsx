import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Booking {
  _id: string;
  teacher: {
    _id: string;
    name: string;
  };
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  notes: string;
  statusThai?: string;
  deductedLesson?: boolean;
  statusUpdatedAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  totalLessons: number;
  usedLessons: number;
}

const ITEMS_PER_PAGE = 6;

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'upcoming', 'past', 'today', 'all'
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    userInfo: {
      name: string;
      username: string;
      totalLessons: number;
      usedLessons: number;
      remainingLessons: number;
    }
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          setError('');
          
          // ใช้ API /api/bookings/my-history แทน /api/bookings/my-bookings
          const res = await axios.get('/api/bookings/my-history');
          console.log('ข้อมูลประวัติการจองของฉัน:', res.data);
          
          // แยกข้อมูลการจองและข้อมูลสรุป
          setBookings(res.data.bookings);
          setBookingSummary(res.data.summary);
          
          // ดึงข้อมูลผู้ใช้เพื่อแสดงจำนวนคาบที่เหลือ
          const userRes = await axios.get('/api/auth/me');
          setUser(userRes.data);
          
          setLoading(false);
        } catch (err) {
          console.error('ไม่สามารถโหลดข้อมูลการจองได้', err);
          setError('ไม่สามารถโหลดข้อมูลการจองได้');
          setLoading(false);
        }
      }
    })();
  }, [isAuthenticated, navigate]);

  // รีเซ็ตหน้าเมื่อมีการเปลี่ยนแท็บหรือค้นหา
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, dateFilter]);

  const formatThaiDate = (dateString: string) => {
    try {
      // สำหรับวันที่ในรูปแบบ ISO string
      if (dateString.includes('T')) {
        return format(parseISO(dateString), 'd MMMM yyyy', { locale: th });
      }
      // สำหรับวันที่ในรูปแบบ yyyy-MM-dd
      return format(new Date(dateString), 'd MMMM yyyy', { locale: th });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'from-yellow-500 to-amber-500';
      case 'confirmed': return 'from-green-500 to-emerald-500';
      case 'completed': return 'from-blue-500 to-cyan-500';
      case 'cancelled': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/20 border-yellow-500/30';
      case 'confirmed': return 'bg-green-900/20 border-green-500/30';
      case 'completed': return 'bg-blue-900/20 border-blue-500/30';
      case 'cancelled': return 'bg-red-900/20 border-red-500/30';
      default: return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  // กรองตามวันที่
  const filterByDate = (booking: Booking) => {
    try {
      const bookingDate = new Date(booking.day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case 'upcoming':
          return isAfter(bookingDate, today);
        case 'past':
          return isBefore(bookingDate, today);
        case 'today':
          return isToday(bookingDate);
        default:
          return true;
      }
    } catch (e) {
      return true;
    }
  };

  // กรองการจองตามหลายเงื่อนไข
  const filteredBookings = bookings.filter(booking => {
    // ตรวจสอบว่า booking.teacher มีอยู่จริงหรือไม่
    if (!booking.teacher || !booking.teacher.name) return false;
    
    // กรองตามแท็บสถานะ
    const statusMatch = activeTab === 'all' || booking.status === activeTab;
    
    // กรองตามการค้นหา (ชื่อครู)
    const searchMatch = searchTerm === '' || 
      booking.teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามวันที่
    const dateMatch = filterByDate(booking);
    
    return statusMatch && searchMatch && dateMatch;
  });

  // จัดกลุ่มการจองตามครู
  const groupedByTeacher = filteredBookings.reduce((acc, booking) => {
    // ตรวจสอบว่า booking.teacher มีอยู่จริงและมี name และ _id
    if (!booking.teacher || !booking.teacher._id || !booking.teacher.name) return acc;
    
    const teacherId = booking.teacher._id;
    if (!acc[teacherId]) {
      acc[teacherId] = {
        teacher: booking.teacher,
        bookings: []
      };
    }
    
    // เรียงลำดับวันที่ล่าสุดไปหาเก่าสุด
    acc[teacherId].bookings.push(booking);
    acc[teacherId].bookings.sort((a, b) => {
      try {
        return new Date(b.day).getTime() - new Date(a.day).getTime();
      } catch (e) {
        return 0;
      }
    });
    
    return acc;
  }, {} as Record<string, { teacher: { _id: string; name: string }, bookings: Booking[] }>);

  // เรียงครูตามชื่อ
  const sortedTeachers = Object.values(groupedByTeacher).sort((a, b) => 
    a.teacher.name.localeCompare(b.teacher.name)
  );
  
  // คำนวณการแบ่งหน้า
  const totalPages = Math.ceil(sortedTeachers.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentTeachers = sortedTeachers.slice(indexOfFirstItem, indexOfLastItem);

  // ฟังก์ชันเปลี่ยนหน้า
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // สลับการแสดง/ซ่อนรายการของครู
  const toggleTeacher = (teacherId: string) => {
    if (expandedTeacher === teacherId) {
      setExpandedTeacher(null);
    } else {
      setExpandedTeacher(teacherId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">การจองของฉัน</h1>
          <p className="text-indigo-200 max-w-3xl mx-auto">ตรวจสอบและจัดการการจองคาบเรียนของคุณ</p>
        </div>

        {/* ส่วนค้นหาและกรอง */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อครู..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
            
            <div className="flex flex-wrap gap-2">
              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">ทุกวัน</option>
                <option value="upcoming">วันที่จะถึง</option>
                <option value="past">วันที่ผ่านมา</option>
                <option value="today">วันนี้</option>
              </select>
            </div>
          </div>
        </div>

        {/* แท็บสำหรับกรองสถานะ */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-1 max-w-2xl mx-auto">
          <div className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              รอดำเนินการ
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'confirmed'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              ยืนยันแล้ว
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>

        {/* เพิ่มการแสดงจำนวนคาบเรียนที่ด้านบนก่อนตารางการจอง */}
        <div className="my-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white">การจองของฉัน</h1>
            
            <div className="mt-4 md:mt-0 flex space-x-4">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                <p className="text-sm text-indigo-300">คาบเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-white">{user?.totalLessons || 0}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                <p className="text-sm text-indigo-300">ใช้ไปแล้ว</p>
                <p className="text-2xl font-bold text-white">{user?.usedLessons || 0}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-indigo-500/20 text-center">
                <p className="text-sm text-indigo-300">คงเหลือ</p>
                <p className="text-2xl font-bold text-white">{(user?.totalLessons || 0) - (user?.usedLessons || 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="w-full md:w-3/4 bg-white/5 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                style={{ 
                  width: `${user?.totalLessons ? (user.usedLessons / user.totalLessons) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="hidden md:flex justify-between mt-1 text-xs text-indigo-300 w-3/4 px-1">
              <span>0</span>
              <span>{user?.totalLessons || 0} คาบ</span>
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md flex items-center text-sm"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              ประวัติการจอง
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 p-4 mb-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
            <svg className="mx-auto h-16 w-16 text-indigo-400 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-white">
              {searchTerm 
                ? 'ไม่พบการจองที่ตรงกับการค้นหา'
                : activeTab === 'all' 
                  ? 'คุณยังไม่มีประวัติการจอง' 
                  : `ไม่พบการจองสถานะ "${getStatusText(activeTab)}"`}
            </h3>
            <p className="mt-2 text-indigo-300">
              {searchTerm 
                ? 'ลองค้นหาด้วยคำอื่น หรือล้างการค้นหา'
                : activeTab === 'all' 
                  ? 'คุณสามารถจองคาบเรียนได้ที่หน้า "ครูของเรา"' 
                  : 'ลองเลือกดูสถานะอื่น หรือดูการจองทั้งหมด'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-indigo-700/50 text-white rounded-lg hover:bg-indigo-700/70 transition-colors"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentTeachers.map(({ teacher, bookings }) => (
                <div key={teacher._id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 px-6 py-4 border-b border-white/10 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleTeacher(teacher._id)}
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                        {teacher.name.charAt(0)}
                      </div>
                      <h2 className="text-xl font-semibold">ครู{teacher.name}</h2>
                      <div className="ml-4 px-2 py-1 bg-indigo-800/50 text-indigo-200 rounded-full text-xs">
                        {bookings.length} คาบเรียน
                      </div>
                    </div>
                    <svg 
                      className={`h-5 w-5 transition-transform ${expandedTeacher === teacher._id ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {(expandedTeacher === teacher._id || expandedTeacher === null) && (
                    <div className="p-4 md:p-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {bookings.map(booking => (
                          <div 
                            key={booking._id} 
                            className={`rounded-lg p-4 border ${getStatusBg(booking.status)}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center mb-1 space-x-1">
                                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm text-white font-medium">{formatThaiDate(booking.day)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm text-white font-medium">{booking.startTime} - {booking.endTime}</span>
                                </div>
                                <div className="flex items-center mt-1 space-x-1">
                                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (booking.teacher && booking.teacher._id) {
                                        navigate(`/teachers/${booking.teacher._id}`);
                                      }
                                    }}
                                    className="text-sm text-indigo-300 font-medium hover:text-indigo-200 flex items-center transition-colors"
                                  >
                                    {booking.teacher && booking.teacher.name ? `ครู${booking.teacher.name}` : 'ไม่ระบุชื่อครู'}
                                    <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(booking.status)} text-white shadow`}>
                                {booking.statusThai || getStatusText(booking.status)}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-indigo-200">
                              <div className="flex justify-between">
                                <span>วันที่จอง:</span>
                                <span>{formatThaiDate(booking.createdAt)}</span>
                              </div>
                            </div>
                            
                            {booking.notes && (
                              <div className="mt-3 p-2 bg-white/5 rounded text-sm">
                                <p className="text-indigo-200">{booking.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-1">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &laquo;
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === number 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* โมดอลแสดงประวัติการจองโดยละเอียด */}
      {showHistoryModal && bookingSummary && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-white flex items-center">
                    <svg className="mr-2 h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    ประวัติการจองของฉัน
                  </h3>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-white hover:text-gray-300 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* ส่วนแสดงข้อมูลสรุป */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-indigo-300">ทั้งหมด</p>
                      <p className="text-2xl font-bold text-white">{bookingSummary.total}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-yellow-500/20">
                      <p className="text-sm text-yellow-300">รอดำเนินการ</p>
                      <p className="text-2xl font-bold text-white">{bookingSummary.pending}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-300">ยืนยันแล้ว</p>
                      <p className="text-2xl font-bold text-white">{bookingSummary.confirmed}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-blue-500/20">
                      <p className="text-sm text-blue-300">เสร็จสิ้น</p>
                      <p className="text-2xl font-bold text-white">{bookingSummary.completed}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-red-500/20">
                      <p className="text-sm text-red-300">ยกเลิก</p>
                      <p className="text-2xl font-bold text-white">{bookingSummary.cancelled}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-indigo-200">
                      <p className="text-sm">จำนวนคาบทั้งหมด: <span className="font-semibold text-white">{bookingSummary.userInfo.totalLessons}</span></p>
                      <p className="text-sm">ใช้ไปแล้ว: <span className="font-semibold text-white">{bookingSummary.userInfo.usedLessons}</span></p>
                      <p className="text-sm">คงเหลือ: <span className="font-semibold text-white">{bookingSummary.userInfo.remainingLessons}</span></p>
                    </div>
                    <div className="w-64 bg-white/5 rounded-full h-2 mr-4">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                        style={{ 
                          width: `${bookingSummary.userInfo.totalLessons ? (bookingSummary.userInfo.usedLessons / bookingSummary.userInfo.totalLessons) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* ตารางแสดงประวัติการจอง */}
                <div className="bg-white/10 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">ครู</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">วันที่</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">เวลา</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">สถานะ</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">หักคาบเรียน</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">จองเมื่อ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {bookings.length > 0 ? (
                          bookings.map((booking: any) => (
                            <tr key={booking._id} className="hover:bg-white/5">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                                {booking.teacher?.name || 'ไม่ระบุ'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-200">
                                {booking.day}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-200">
                                {booking.startTime} - {booking.endTime}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs
                                  ${booking.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300' : ''}
                                  ${booking.status === 'confirmed' ? 'bg-green-900/30 text-green-300' : ''}
                                  ${booking.status === 'completed' ? 'bg-blue-900/30 text-blue-300' : ''}
                                  ${booking.status === 'cancelled' ? 'bg-red-900/30 text-red-300' : ''}
                                `}>
                                  {booking.statusThai || getStatusText(booking.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-200">
                                {booking.deductedLesson ? (
                                  <span className="text-green-300 flex items-center">
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    หักแล้ว
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-200">
                                {booking.statusUpdatedAt || new Date(booking.createdAt).toLocaleDateString('th-TH')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-indigo-300">
                              ไม่พบประวัติการจอง
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;