import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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

const TeacherList = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get('/api/teachers');
        console.log('ข้อมูลครูที่ได้รับ:', res.data);
        // กรองข้อมูลที่ไม่ถูกต้อง
        const validTeachers = res.data.filter((teacher: any) => 
          teacher && 
          typeof teacher === 'object' && 
          teacher._id && 
          typeof teacher.name === 'string' &&
          Array.isArray(teacher.availableSlots)
        );
        setTeachers(validTeachers);
        setLoading(false);
      } catch (err: any) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลครู:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลครู');
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(teacher => {
    if (!teacher || !teacher.name || !teacher.profileDescription) return false;
    
    const matchesSearch = searchTerm === '' || 
                         teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         teacher.profileDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedDay && selectedDay !== 'all') {
      const hasAvailabilityOnDay = teacher.availableSlots?.some(
        slot => !slot.isBooked && slot.day === selectedDay
      );
      return matchesSearch && hasAvailabilityOnDay;
    }
    
    return matchesSearch;
  });

  // Group available slots by day of week for a teacher
  const getAvailableSlotsByDay = (teacher: Teacher) => {
    if (!teacher?.availableSlots) return {};
    const slots = teacher.availableSlots.filter(slot => !slot?.isBooked);
    return slots.reduce((acc, slot) => {
      if (!slot?.day) return acc;
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push(slot);
      return acc;
    }, {} as Record<string, Slot[]>);
  };

  const availableDays = Array.from(
    new Set(
      teachers.flatMap(teacher => 
        (teacher?.availableSlots || [])
          .filter(slot => !slot?.isBooked)
          .map(slot => slot?.day)
      )
    )
  ).sort();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 border-opacity-20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
            <span className="text-white text-lg font-medium">AI</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl p-6 max-w-lg mx-auto animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-white">{error}</h3>
              <p className="mt-2 text-indigo-200">เราไม่สามารถโหลดข้อมูลครูได้ โปรดลองใหม่อีกครั้ง</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-900 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        <div 
          ref={headerRef}
          className={`sticky top-0 z-20 py-6 transition-all duration-300 ${
            scrollPosition > 50 ? 'bg-indigo-900/90 backdrop-blur-lg shadow-xl rounded-2xl px-6 -mx-6' : ''
          }`}
        >
          <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-300 sm:text-4xl">ครูของเรา</h2>
              <p className="mt-3 max-w-2xl mx-auto text-lg text-indigo-200 sm:mt-4">
                เลือกครูและจองเวลาเรียนตามความต้องการของคุณ
              </p>
            </div>

            {/* Search and filter */}
            <div className={`mt-6 max-w-3xl mx-auto transition-all duration-500 ${scrollPosition > 50 ? 'opacity-100' : 'opacity-100'}`}>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 p-4">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="ค้นหาครูตามชื่อหรือรายละเอียด"
                      className="block w-full pl-10 pr-3 py-2.5 sm:text-sm bg-white/5 border border-indigo-300/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-indigo-300 transition-all duration-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-300 hover:text-white transition-colors duration-200"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="sm:w-48">
                    <div className="relative">
                      <select
                        className="block w-full pl-3 pr-10 py-2.5 text-sm bg-white/5 border border-indigo-300/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white appearance-none transition-all duration-200"
                        value={selectedDay || 'all'}
                        onChange={(e) => setSelectedDay(e.target.value === 'all' ? null : e.target.value)}
                      >
                        <option value="all">ทุกวัน</option>
                        {availableDays.map(day => (
                          <option key={day} value={day} className="text-gray-900">
                            {dayTranslation[day] || day}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          {filteredTeachers.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 p-8 text-center max-w-3xl mx-auto animate-fade-in">
              <svg className="h-20 w-20 text-indigo-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="mt-6 text-xl text-white">ไม่พบครูที่ตรงกับเงื่อนไขการค้นหา</p>
              <p className="mt-2 text-indigo-300">ลองปรับเปลี่ยนเงื่อนไขการค้นหาและลองอีกครั้ง</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedDay(null); }}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-900 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                ล้างการค้นหา
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeachers.map((teacher, index) => (
                <div 
                  key={teacher?._id || index} 
                  className={`
                    group relative bg-white/10 backdrop-blur-xl overflow-hidden rounded-xl shadow-lg hover:shadow-2xl border border-white/10 transition-all duration-500 
                    transform hover:-translate-y-1 hover:scale-[1.02] transition-opacity ease-in-out duration-700 
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `} 
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Card background glow effect */}
                  <div className="absolute -inset-[100px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500 group-hover:duration-200"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {(teacher?.name || '?').charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-pink-400 transition-all duration-300">
                          {teacher?.name || 'ไม่ระบุชื่อ'}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Array.from(new Set((teacher?.availableSlots || [])
                            .filter(slot => !slot?.isBooked)
                            .map(slot => slot?.day)))
                            .slice(0, 3)
                            .map(day => (
                              <span key={day} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-200 border border-indigo-500/30">
                                {dayTranslation[day || ''] || day}
                              </span>
                            ))}
                          {Array.from(new Set((teacher?.availableSlots || [])
                            .filter(slot => !slot?.isBooked)
                            .map(slot => slot?.day)))
                            .length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-200 border border-indigo-500/30">
                              +{Array.from(new Set((teacher?.availableSlots || [])
                                .filter(slot => !slot?.isBooked)
                                .map(slot => slot?.day)))
                                .length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 min-h-[4rem] text-indigo-100 line-clamp-3">
                      <p>{teacher?.profileDescription || 'ไม่มีคำอธิบาย'}</p>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-indigo-500/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-indigo-300">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="ml-2 text-sm font-medium">
                            {(teacher?.availableSlots || []).filter(slot => !slot?.isBooked).length} เวลาว่าง
                          </span>
                        </div>
                        
                        <Link
                          to={`/teachers/${teacher?._id || ''}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          ดูโปรไฟล์และจอง
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default TeacherList;