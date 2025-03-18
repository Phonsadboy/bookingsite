import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';

interface Slot {
  day: string;
  startTime: string;
  endTime: string;
  status?: string;
  booking?: {
    _id: string;
    user: {
      _id: string;
      username: string;
      name: string;
    };
  };
}

interface Teacher {
  _id: string;
  name: string;
  profileDescription: string;
  availableSlots: Slot[];
}

interface Booking {
  _id: string;
  user: {
    _id: string;
    username: string;
    name: string;
  };
  teacher: {
    _id: string;
    name: string;
  };
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  totalLessons: number;
  usedLessons: number;
  password: string;
}

interface TeacherFormData {
  name: string;
  profileDescription: string;
}

interface SlotFormData {
  day: string;
  startTime: string;
  endTime: string;
}

interface UserFormData {
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  totalLessons: number;
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

const statusTranslation: { [key: string]: string } = {
  'pending': 'รอดำเนินการ',
  'confirmed': 'ยืนยันแล้ว',
  'completed': 'เสร็จสิ้น',
  'cancelled': 'ยกเลิก'
};

const statusColors: { [key: string]: string } = {
  'pending': 'bg-yellow-100 text-black border-yellow-200',
  'confirmed': 'bg-green-100 text-black border-green-200',
  'completed': 'bg-blue-100 text-black border-blue-200',
  'cancelled': 'bg-red-100 text-black border-red-200',
};

const timeSlots = [
  '09.00-09.40', '09.40-10.20', '10.20-11.00', '11.00-11.40', '11.40-12.20', 
  '12.20-13.00', '13.00-13.40', '13.40-14.20', '14.30-15.10', '15.10-15.50', 
  '15.50-16.30', '16.30-17.10', '17.10-17.50', '17.50-18.30', '18.30-19.10', 
  '19.20-20.00', '20.00-20.40', '20.50-21.30', '21.30-22.10', '22.10-22.50', '22.50-23.30'
];

// Group slots by date and sort by date
const groupSlotsByDate = (slots: any[]) => {
  const grouped: Record<string, any[]> = {};
  slots.forEach(slot => {
    if (!grouped[slot.day]) {
      grouped[slot.day] = [];
    }
    grouped[slot.day].push(slot);
  });
  
  // เรียงวันที่จากน้อยไปมาก (เริ่มจากวันที่ปัจจุบันเป็นต้นไป)
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });
  
  const sortedGrouped: Record<string, any[]> = {};
  sortedDates.forEach(date => {
    sortedGrouped[date] = grouped[date];
  });
  
  return sortedGrouped;
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [teacherFormData, setTeacherFormData] = useState<TeacherFormData>({
    name: '',
    profileDescription: ''
  });
  const [slotFormData, setSlotFormData] = useState<SlotFormData>({
    day: 'Monday',
    startTime: '',
    endTime: ''
  });
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    name: '',
    password: '',
    role: 'user',
    totalLessons: 0
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<Teacher | null>(null);
  const [selectedUserForBooking, setSelectedUserForBooking] = useState<string>('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTeacher, setSearchTeacher] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandAllSchedules, setExpandAllSchedules] = useState(false);
  const [expandedTeachers, setExpandedTeachers] = useState<string[]>([]);
  // เพิ่มตัวแปร state เพื่อติดตามการจองใหม่ที่ยังไม่ได้ดำเนินการ
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [newBookingsCount, setNewBookingsCount] = useState<number>(0);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  // เพิ่ม state สำหรับควบคุมการรีเฟรชอัตโนมัติ
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('ยังไม่ได้รีเฟรช');
  // เพิ่ม state สำหรับการแสดงโมดอลประวัติการจอง
  const [showBookingHistoryModal, setShowBookingHistoryModal] = useState(false);
  const [userBookingHistory, setUserBookingHistory] = useState<any>({ bookings: [], summary: null });
  const [loadingBookingHistory, setLoadingBookingHistory] = useState(false);

  // กรองรายชื่อครูตามคำค้นหา
  const filteredTeachers = searchTeacher 
    ? teachers.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTeacher.toLowerCase())
      )
    : teachers;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่ ถ้าไม่ใช่ให้ redirect ไปหน้าหลัก
    if (isAuthenticated && user?.role !== 'admin') {
      navigate('/');
    }
    // ถ้าไม่ได้ล็อกอิน ให้ redirect ไปหน้า login
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // อัพเดตฟังก์ชัน fetchTeachersWithBookings เพื่อติดตามการจองใหม่
  const fetchTeachersWithBookings = async () => {
    try {
      console.log('กำลังดึงข้อมูลครูและการจอง...');
      
      // ดึงข้อมูลครูและการจองพร้อมกัน
      const [teachersRes, bookingsRes] = await Promise.all([
        axios.get('/api/teachers'),
        axios.get('/api/bookings/all')
      ]);
      
      const teachersData = teachersRes.data;
      const bookingsData = bookingsRes.data;
      
      console.log('ข้อมูลการจองทั้งหมด:', bookingsData.length, 'รายการ');
      
      // ตรวจสอบการจองที่สถานะเป็น pending
      const newPendingBookings = bookingsData.filter((b: Booking) => b.status === 'pending');
      setPendingBookings(newPendingBookings);
      
      // ตรวจสอบการจองใหม่
      const now = new Date();
      const newBookings = bookingsData.filter((b: Booking) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate > lastCheck && b.status === 'pending';
      });
      
      // ถ้ามีการจองใหม่ ให้อัพเดทจำนวนและแสดงการแจ้งเตือน
      if (newBookings.length > 0) {
        setNewBookingsCount(prevCount => prevCount + newBookings.length);
        
        // แสดงการแจ้งเตือนบนแท็บบราวเซอร์
        if (document.hidden && newBookings.length > 0) {
          // เปลี่ยนชื่อแท็บเพื่อแจ้งเตือน
          document.title = `(${newBookings.length} การจองใหม่) | แอดมิน`;
          
          // ถ้าบราวเซอร์สนับสนุนการแจ้งเตือน
          if (Notification && Notification.permission === "granted") {
            new Notification("มีการจองใหม่!", {
              body: `มี ${newBookings.length} การจองใหม่ที่รอการยืนยัน`,
              icon: "/favicon.ico"
            });
          }
        }
      }
      
      // อัพเดทเวลาตรวจสอบล่าสุด
      setLastCheck(now);
      
      // เพิ่มข้อมูลการจองลงในช่วงเวลาของครู
      const updatedTeachers = teachersData.map((teacher: Teacher) => {
        // ตรวจสอบว่า teacher มีข้อมูลที่ถูกต้อง
        if (!teacher || !teacher._id || !teacher.name) {
          console.error('พบข้อมูลครูที่ไม่สมบูรณ์:', teacher);
          return null; // ข้ามครูที่ข้อมูลไม่สมบูรณ์
        }
        
        const updatedSlots = teacher.availableSlots.map(slot => {
          // ตรวจสอบว่า slot มีข้อมูลที่ถูกต้อง
          if (!slot || !slot.day || !slot.startTime || !slot.endTime) {
            console.error('พบข้อมูล slot ที่ไม่ถูกต้อง:', slot);
            return slot;
          }
          
          // ค้นหาการจองที่ตรงกับครูและช่วงเวลานี้ที่ไม่ยกเลิก
          const booking = bookingsData.find((b: Booking) => 
            b && b.teacher && b.teacher._id === teacher._id && 
            b.day === slot.day && 
            b.startTime === slot.startTime && 
            b.endTime === slot.endTime &&
            b.status !== 'cancelled'
          );
          
          try {
            if (booking && booking.user && booking._id) {
              console.log('พบการจอง:', booking._id, 'สำหรับครู:', teacher.name, 'วันที่:', slot.day, 'เวลา:', slot.startTime);
              return { 
                ...slot, 
                booking: { 
                  _id: booking._id, 
                  user: {
                    _id: booking.user._id || '',
                    username: booking.user.username || '',
                    name: booking.user.name || ''
                  } 
                } 
              };
            }
          } catch (error) {
            console.error('เกิดข้อผิดพลาดในการประมวลผลการจอง:', error);
          }
          return slot;
        });
        
        return { ...teacher, availableSlots: updatedSlots };
      });
      
      // กรองครูที่ข้อมูลไม่สมบูรณ์ออก (ข้อมูลที่เป็น null)
      const filteredTeachers = updatedTeachers.filter(teacher => teacher !== null);
      
      console.log('อัพเดทข้อมูลครูเรียบร้อย:', filteredTeachers.length, 'คน');
      setTeachers(filteredTeachers);
      setBookings(bookingsData);
      setLoading(false);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
      setError('ไม่สามารถโหลดข้อมูลครูและการจองได้');
      setLoading(false);
    }
  };

  // รีเซ็ตตัวนับการจองใหม่เมื่อผู้ใช้เข้ามาดูที่แท็บ
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // รีเซ็ตชื่อแท็บ
        document.title = 'แอดมิน | ระบบจัดการการจอง';
        // รีเซ็ตตัวนับเมื่อผู้ใช้กลับมาที่แท็บ
        setNewBookingsCount(0);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // เพิ่ม Effect Hook ให้ขยายรายการครูทุกคนหรือยุบทั้งหมดตามการเปลี่ยนสถานะ expandAllSchedules
  useEffect(() => {
    if (expandAllSchedules) {
      setExpandedTeachers(teachers.map(teacher => teacher._id));
    } else {
      setExpandedTeachers([]);
    }
  }, [expandAllSchedules, teachers]);

  // เพิ่มฟังก์ชันสำหรับการลบการจอง
  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบการจองนี้?')) {
      try {
        await axios.delete(`/api/bookings/${bookingId}`);
        
        // รีเฟรชข้อมูลทั้งหมด
        await fetchTeachersWithBookings();
        const res = await axios.get('/api/bookings/all');
        setBookings(res.data);
        
        console.log('ลบการจองเรียบร้อยแล้ว');
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการลบการจอง:', err);
        setError('ไม่สามารถลบการจองได้');
      }
    }
  };

  // เพิ่มฟังก์ชันสำหรับเปิดฟอร์มเพิ่มการจอง
  const openAddBookingModal = (teacher: Teacher, slot: any) => {
    setSelectedTeacherForBooking(teacher);
    setSelectedSlot(slot);
    setShowAddBookingModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        if (activeTab === 'teachers') {
          await fetchTeachersWithBookings();
        } else if (activeTab === 'users') {
          const res = await axios.get('/api/auth/users');
          setUsers(res.data);
        }

        setLoading(false);
      } catch (err: any) {
        setError(`เกิดข้อผิดพลาดในการโหลด${
          activeTab === 'teachers' ? 'ข้อมูลครูและการจอง' : 'ผู้ใช้'
        }`);
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [activeTab, isAuthenticated, user]);

  // เพิ่ม useEffect เพื่อโหลดข้อมูลการจองทุกๆ 30 วินาที เพื่อให้ข้อมูลอัพเดทตลอดเวลา
  useEffect(() => {
    // โหลดข้อมูลเมื่อเปิดหน้าครั้งแรก
    if (isAuthenticated && user?.role === 'admin' && activeTab === 'teachers') {
      fetchTeachersWithBookings();
      
      // ตั้งเวลาให้โหลดข้อมูลทุกๆ 10 วินาที เฉพาะเมื่อเปิดใช้การรีเฟรชอัตโนมัติ
      let intervalId: NodeJS.Timeout | null = null;
      
      if (autoRefresh) {
        intervalId = setInterval(() => {
          if (activeTab === 'teachers') {
            fetchTeachersWithBookings();
            const now = new Date();
            setLastRefreshTime(
              `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
            );
          }
        }, 30000); // 30 วินาที
      }
      
      // ทำความสะอาดเมื่อ component unmount
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [isAuthenticated, user, activeTab, autoRefresh]);

  // เพิ่ม useEffect เพื่อโหลดข้อมูลการจองเมื่อผู้ใช้กลับมาที่แท็บ
  useEffect(() => {
    // ตรวจสอบเมื่อหน้าเว็บกลับมาทำงานหลังจากถูกย่อหรือปิดแท็บชั่วคราว
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.role === 'admin' && activeTab === 'teachers') {
        fetchTeachersWithBookings();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, activeTab]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/teachers', teacherFormData);
      const res = await axios.get('/api/teachers');
      setTeachers(res.data);
      setShowAddTeacherModal(false);
      setTeacherFormData({ name: '', profileDescription: '' });
    } catch (err: any) {
      setError('ไม่สามารถเพิ่มครูได้');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบครูคนนี้?')) {
      try {
        await axios.delete(`/api/teachers/${teacherId}`);
        const res = await axios.get('/api/teachers');
        setTeachers(res.data);
      } catch (err: any) {
        setError('ไม่สามารถลบครูได้');
      }
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedDate || selectedTimeSlots.length === 0) return;

    try {
      // สร้าง promises สำหรับการเพิ่มเวลาสอนทั้งหมด
      const addSlotPromises = selectedTimeSlots.map(timeSlot => {
        const [startTime, endTime] = timeSlot.split('-');
        const formattedStartTime = startTime.replace('.', ':');
        const formattedEndTime = endTime.replace('.', ':');

        // ใช้ selectedDate ในการกำหนดวัน
        const slots = {
          day: selectedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime
        };

        return axios.post(`/api/teachers/${selectedTeacher._id}/slots`, slots);
      });

      // รอให้ทุก request เสร็จสิ้น
      await Promise.all(addSlotPromises);
      
      // ดึงข้อมูลครูใหม่
      const res = await axios.get('/api/teachers');
      setTeachers(res.data);
      setShowAddSlotModal(false);
      setSelectedDate('');
      setSelectedTimeSlots([]);
    } catch (err: any) {
      setError('ไม่สามารถเพิ่มเวลาสอนได้');
    }
  };

  const handleDeleteSlot = async (teacherId: string, slotIndex: number) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบเวลาสอนนี้?')) {
      try {
        await axios.delete(`/api/teachers/${teacherId}/slots/${slotIndex}`);
        const res = await axios.get('/api/teachers');
        setTeachers(res.data);
      } catch (err: any) {
        setError('ไม่สามารถลบเวลาสอนได้');
      }
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status });
      
      // รีเฟรชข้อมูลทั้งหมด
      await fetchTeachersWithBookings();
      const res = await axios.get('/api/bookings/all');
      setBookings(res.data);
      
      console.log('อัพเดทสถานะการจองเรียบร้อยแล้ว');
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะการจอง:', err);
      setError('ไม่สามารถอัพเดทสถานะการจองได้');
    }
  };

  const handleUpdateUserLessons = async (userId: string, totalLessons: number) => {
    try {
      await axios.put(`/api/auth/users/${userId}/lessons`, { totalLessons });
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
    } catch (err: any) {
      setError('ไม่สามารถอัพเดทจำนวนบทเรียนได้');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', userFormData);
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
      setShowAddUserModal(false);
      setUserFormData({
        username: '',
        name: '',
        password: '',
        role: 'user',
        totalLessons: 0
      });
    } catch (err: any) {
      setError('ไม่สามารถเพิ่มผู้ใช้ได้');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const userData = { ...userFormData };
      
      // ส่งข้อมูลไปอัพเดทที่ server
      await axios.put(`/api/auth/users/${selectedUser._id}`, userData);
      
      // ดึงข้อมูลผู้ใช้ทั้งหมดใหม่
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
      
      // ปิดฟอร์ม และรีเซ็ตข้อมูล
      setShowEditUserModal(false);
      setSelectedUser(null);
      setUserFormData({
        username: '',
        name: '',
        password: '',
        role: 'user',
        totalLessons: 0
      });
    } catch (err: any) {
      setError('ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้');
    }
  };

  const openEditUserModal = async (user: User) => {
    try {
      // ดึงข้อมูลผู้ใช้แบบเต็มจาก API เพื่อให้แน่ใจว่าข้อมูลเป็นปัจจุบัน
      const response = await axios.get(`/api/auth/users/${user._id}`);
      const fullUserData = response.data;
      
      setSelectedUser(fullUserData);
      setUserFormData({
        username: fullUserData.username,
        name: fullUserData.name || '',
        password: fullUserData.password || '',
        role: fullUserData.role,
        totalLessons: fullUserData.totalLessons
      });
      
      setShowEditUserModal(true);
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBooking || !selectedTeacherForBooking || !selectedSlot) return;

    try {
      await axios.post(`/api/bookings`, {
        user: selectedUserForBooking,
        teacher: selectedTeacherForBooking._id,
        day: selectedSlot.day,
        date: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'pending'
      });
      
      // รีเฟรชข้อมูลทั้งหมด
      await fetchTeachersWithBookings();
      const res = await axios.get('/api/bookings/all');
      setBookings(res.data);
      
      setShowAddBookingModal(false);
      setSelectedTeacherForBooking(null);
      setSelectedSlot(null);
      setSelectedUserForBooking('');
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มการจอง:', err);
      setError('ไม่สามารถเพิ่มการจองได้');
    }
  };

  const getFilteredSlots = (teacher: Teacher): Slot[] => {
    return teacher.availableSlots.filter(slot => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'available') return !slot.booking;
      if (statusFilter === 'booked') return !!slot.booking;
      
      try {
        if (statusFilter === 'pending') {
          if (!slot.booking || !slot.booking._id) return false;
          const matchingBooking = bookings.find(b => b && b._id === slot.booking?._id);
          return !!matchingBooking && matchingBooking.status === 'pending';
        }
        if (statusFilter === 'confirmed') {
          if (!slot.booking || !slot.booking._id) return false;
          const matchingBooking = bookings.find(b => b && b._id === slot.booking?._id);
          return !!matchingBooking && matchingBooking.status === 'confirmed';
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการกรองช่วงเวลา:', error);
        return false;
      }
      
      return false;
    });
  };

  const getGroupedAndFilteredSlots = (teacher: Teacher): [string, Slot[]][] => {
    const grouped = groupSlotsByDate(getFilteredSlots(teacher));
    return Object.entries(grouped).map(([date, slots]) => [date, slots.sort((a, b) => a.startTime.localeCompare(b.startTime))]);
  };

  const toggleTeacherSchedule = (teacherId: string) => {
    setExpandedTeachers(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  const getSlotStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-500/30';
      case 'confirmed': return 'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30';
      case 'completed': return 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/30';
      case 'cancelled': return 'bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/30';
      default: return 'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30';
    }
  };

  // เพิ่มฟังก์ชันสำหรับรีเฟรชข้อมูลแบบแมนนวล
  const handleManualRefresh = async () => {
    try {
      await fetchTeachersWithBookings();
      const now = new Date();
      setLastRefreshTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล:', err);
    }
  };

  // เพิ่มฟังก์ชันสำหรับดึงประวัติการจองของผู้ใช้
  const fetchUserBookingHistory = async (userId: string) => {
    try {
      setLoadingBookingHistory(true);
      const res = await axios.get(`/api/bookings/user/${userId}`);
      setUserBookingHistory(res.data);
      setShowBookingHistoryModal(true);
      setLoadingBookingHistory(false);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการดึงประวัติการจอง:', err);
      setError('ไม่สามารถดึงประวัติการจองได้');
      setLoadingBookingHistory(false);
    }
  };

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
              <p className="mt-2 text-indigo-200">โปรดลองใหม่อีกครั้งในภายหลัง</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white px-4 sm:px-6 lg:px-8">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className={`max-w-7xl mx-auto py-8 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-300 sm:text-4xl">แดชบอร์ดผู้ดูแลระบบ</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-indigo-200 sm:mt-4">
            จัดการข้อมูลครู การจอง และผู้ใช้งาน
          </p>
          
          {/* แสดงสรุปข้อมูลการจองที่รอดำเนินการ */}
          {pendingBookings.length > 0 && (
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-600/50 to-amber-700/50 text-white border border-yellow-500/30">
              <svg className="h-5 w-5 mr-2 text-yellow-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">มี {pendingBookings.length} การจองที่รอการยืนยัน</span>
              {newBookingsCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold animate-bounce">
                  +{newBookingsCount} ใหม่
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 mb-8">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`${activeTab === 'teachers' ? 'border-pink-500 text-white font-medium' : 'border-transparent text-indigo-300 hover:text-white hover:border-indigo-400'} flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              <div className="flex items-center justify-center">
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                ครูและการจอง
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${activeTab === 'users' ? 'border-pink-500 text-white font-medium' : 'border-transparent text-indigo-300 hover:text-white hover:border-indigo-400'} flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              <div className="flex items-center justify-center">
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                ผู้ใช้
              </div>
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* ส่วนจัดการครู */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">จัดการครู</h3>
                  <div className="flex space-x-2 items-center">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ค้นหาครูจากชื่อ..."
                        className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm w-64"
                        value={searchTeacher}
                        onChange={(e) => setSearchTeacher(e.target.value)}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    {/* ปุ่มรีเฟรชข้อมูล */}
                    <button
                      onClick={handleManualRefresh}
                      className={`inline-flex items-center px-3 py-2 border border-white/20 rounded-md text-sm font-medium ${loading ? 'bg-indigo-900/50 text-indigo-300' : 'text-white hover:bg-white/5'}`}
                      disabled={loading}
                    >
                      <svg className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      รีเฟรช
                    </button>
                    {/* ตัวเลือกรีเฟรชอัตโนมัติ */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={autoRefresh}
                          onChange={() => setAutoRefresh(!autoRefresh)}
                        />
                        <div className={`relative w-10 h-5 ${autoRefresh ? 'bg-indigo-600' : 'bg-white/20'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                        <span className="ml-2 text-xs text-white">{autoRefresh ? 'รีเฟรชอัตโนมัติ' : 'รีเฟรชเอง'}</span>
                      </label>
                    </div>
                    {lastRefreshTime !== 'ยังไม่ได้รีเฟรช' && (
                      <div className="text-xs text-indigo-300">
                        รีเฟรชล่าสุด: {lastRefreshTime}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAddTeacherModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      เพิ่มครูใหม่
                    </button>
                  </div>
                </div>
                
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        ชื่อ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        คำอธิบาย
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          จำนวนช่วงเวลาสอน
                      </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          จำนวนการจอง
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-indigo-300 uppercase tracking-wider">
                          การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((teacher) => {
                          // ตรวจสอบว่า teacher มีข้อมูลที่ถูกต้อง
                          if (!teacher || !teacher._id || !teacher.name) {
                            console.error('พบข้อมูลครูที่ไม่สมบูรณ์:', teacher);
                            return null; // ข้ามครูที่ข้อมูลไม่สมบูรณ์
                          }
                          
                          // คำนวณจำนวนการจองทั้งหมดของครู
                          const availableSlots = teacher.availableSlots || [];
                          let bookedSlots = 0;
                          try {
                            bookedSlots = availableSlots.filter(slot => slot && !!slot.booking).length;
                          } catch (error) {
                            console.error('เกิดข้อผิดพลาดในการนับจำนวนช่วงเวลาที่ถูกจอง:', error);
                          }
                          const totalSlots = availableSlots.length;
                          
                          return (
                            <tr key={teacher._id} className="hover:bg-white/5">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {teacher.name || 'ไม่ระบุชื่อ'}
                              </td>
                              <td className="px-6 py-4 text-sm text-indigo-200 max-w-xs truncate">
                                {teacher.profileDescription || 'ไม่มีคำอธิบาย'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                                {totalSlots} ช่วงเวลา
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                  <span className={`${bookedSlots > 0 ? 'text-green-400' : 'text-indigo-300'}`}>
                                    {bookedSlots} จาก {totalSlots}
                                  </span>
                                  {totalSlots > 0 && (
                                    <div className="ml-2 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                        style={{ width: `${(bookedSlots / totalSlots) * 100}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-3 justify-end">
                                  <button
                                    onClick={() => {
                                      setSelectedTeacher(teacher);
                                      setShowAddSlotModal(true);
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 flex items-center"
                                  >
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>เพิ่มเวลา</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const teacherElement = document.getElementById(`teacher-schedule-${teacher._id}`);
                                      if (teacherElement) {
                                        teacherElement.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }}
                                    className="text-blue-400 hover:text-blue-300 flex items-center"
                                  >
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>ดูตาราง</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeacher(teacher._id)}
                                    className="text-red-400 hover:text-red-300 flex items-center"
                                  >
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>ลบครู</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-indigo-300">
                            {searchTeacher ? (
                              <>
                                <svg className="mx-auto h-10 w-10 text-indigo-400/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>ไม่พบครูที่ค้นหา</p>
                              </>
                            ) : (
                              <>
                                <svg className="mx-auto h-10 w-10 text-indigo-400/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p>ยังไม่มีข้อมูลครู</p>
                                <button
                                  onClick={() => setShowAddTeacherModal(true)}
                                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-indigo-100 bg-indigo-800/50 hover:bg-indigo-700/50"
                                >
                                  เพิ่มครูคนแรก
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ปรับปรุงการแสดงตารางเวลาสอนของครูแต่ละคน */}
              <div className="mt-6 mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white flex items-center">
                  <svg className="h-6 w-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  ตารางเวลาสอนและการจอง
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => fetchTeachersWithBookings()}
                    className="inline-flex items-center px-3 py-2 border border-white/20 rounded-md text-sm font-medium text-white hover:bg-white/5"
                    title="รีเฟรชข้อมูล"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    รีเฟรชข้อมูล
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ค้นหาวันที่..."
                      className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm w-48"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <select 
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ backgroundColor: '#1e1e3f', color: 'white' }}
                  >
                    <option value="all" style={{ backgroundColor: '#1e1e3f', color: 'white' }}>ทุกสถานะ</option>
                    <option value="available" style={{ backgroundColor: '#1e1e3f', color: '#4ade80' }}>ว่าง</option>
                    <option value="booked" style={{ backgroundColor: '#1e1e3f', color: '#60a5fa' }}>จองแล้ว</option>
                    <option value="pending" style={{ backgroundColor: '#1e1e3f', color: '#facc15' }}>รอยืนยัน</option>
                    <option value="confirmed" style={{ backgroundColor: '#1e1e3f', color: '#34d399' }}>ยืนยันแล้ว</option>
                  </select>
                  <button
                    onClick={() => setExpandAllSchedules(!expandAllSchedules)}
                    className="inline-flex items-center px-3 py-2 border border-white/20 rounded-md text-sm font-medium text-white hover:bg-white/5"
                  >
                    {expandAllSchedules ? (
                      <>
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                        ยุบทั้งหมด
                      </>
                    ) : (
                      <>
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        ขยายทั้งหมด
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ส่วนตารางเวลาสอนและการจองของครูแต่ละคน */}
              {filteredTeachers.map((teacher) => (
                <div 
                  key={teacher._id} 
                  id={`teacher-schedule-${teacher._id}`}
                  className="mb-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 overflow-hidden"
                >
                  <div 
                    className="p-4 border-b border-white/10 flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleTeacherSchedule(teacher._id)}
                  >
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                        {teacher.name.charAt(0)}
                      </div>
                      <span>ตารางเวลาสอนของ {teacher.name}</span>
                      <span className="ml-3 text-xs px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded-full">
                        {getFilteredSlots(teacher).length} ช่วงเวลา
                      </span>
                    </h3>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeacher(teacher);
                          setShowAddSlotModal(true);
                        }}
                        className="mr-3 inline-flex items-center px-3 py-1.5 border border-indigo-500 rounded-md text-sm font-medium text-indigo-300 hover:bg-indigo-800/30 transition-colors"
                      >
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        เพิ่มเวลาสอน
                      </button>
                      <svg 
                        className={`h-5 w-5 text-indigo-300 transition-transform ${expandedTeachers.includes(teacher._id) ? 'transform rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {expandedTeachers.includes(teacher._id) && (
                    <div className="p-4">
                      <div className="space-y-6">
                        {getFilteredSlots(teacher).length > 0 ? (
                          getGroupedAndFilteredSlots(teacher).map(([date, slots]) => (
                            <div key={date} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="font-medium text-white text-lg mb-3 flex items-center">
                                <svg className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(date)}
                                <span className="ml-3 text-sm px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full">
                                  {slots.length} ช่วงเวลา
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {slots.map((slot, index) => {
                                  // ค้นหา index ของ slot ในอาร์เรย์ availableSlots เพื่อใช้ในการลบ
                                  let slotIndex = -1;
                                  try {
                                    slotIndex = teacher.availableSlots?.findIndex(
                                      s => s && s.day === slot.day && s.startTime === slot.startTime && s.endTime === slot.endTime
                                    ) || -1;
                                  } catch (error) {
                                    console.error('เกิดข้อผิดพลาดในการค้นหา slot index:', error);
                                  }
                                  
                                  // ค้นหาข้อมูลการจองที่เกี่ยวข้องกับช่วงเวลานี้
                                  let bookingDetail: Booking | undefined = undefined;
                                  try {
                                    bookingDetail = bookings.find(b => {
                                      return b && b.teacher && b.teacher._id === teacher._id && 
                                             b.day === slot.day && 
                                             b.startTime === slot.startTime && 
                                             b.endTime === slot.endTime &&
                                             b.status !== 'cancelled';
                                    });
                                  } catch (error) {
                                    console.error('เกิดข้อผิดพลาดในการค้นหาการจอง:', error);
                                  }
                                  
                                  // กำหนดสถานะและ ID ของการจอง (ถ้ามี)
                                  const bookingStatus = bookingDetail?.status || 'available';
                                  const bookingId = bookingDetail?._id || '';
                                  const slotClassName = getSlotStatusClass(bookingStatus);
                                  
                                  // ชื่อของผู้ใช้ที่จอง (มีการตรวจสอบเพื่อป้องกันข้อผิดพลาด)
                                  let userName = 'ไม่ระบุชื่อ';
                                  try {
                                    if (bookingDetail && bookingDetail.user) {
                                      userName = bookingDetail.user.name || bookingDetail.user.username || 'ไม่ระบุชื่อ';
                                    }
                                  } catch (error) {
                                    console.error('เกิดข้อผิดพลาดในการเข้าถึงชื่อผู้ใช้:', error);
                                  }
                                  
                                  return (
                                    <div 
                                      key={`${slot.day}-${slot.startTime}-${index}`} 
                                      className={`rounded-lg p-3 ${slotClassName} hover:border-opacity-50 transition-all`}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="text-white font-medium flex items-center">
                                          <svg className="h-4 w-4 mr-1.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {slot.startTime} - {slot.endTime}
                                        </div>
                                        <div className="flex space-x-1">
                                          {!bookingDetail && (
                                            <button
                                              onClick={() => openAddBookingModal(teacher, slot)}
                                              className="p-1.5 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                              title="เพิ่มการจอง"
                                            >
                                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                              </svg>
                                            </button>
                                          )}
                                          <button
                                            onClick={() => slotIndex >= 0 ? handleDeleteSlot(teacher._id, slotIndex) : null}
                                            className="p-1.5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                            title="ลบช่วงเวลา"
                                            disabled={slotIndex < 0}
                                          >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {bookingDetail ? (
                                        <div>
                                          <div className="flex items-center text-sm text-green-300 mb-2">
                                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>
                                              {(() => {
                                                try {
                                                  if (bookingDetail && bookingDetail.status) {
                                                    switch(bookingDetail.status) {
                                                      case 'pending': return 'รอดำเนินการ';
                                                      case 'confirmed': return 'ยืนยันแล้ว';
                                                      case 'completed': return 'เสร็จสิ้น';
                                                      case 'cancelled': return 'ยกเลิก';
                                                      default: return 'จองแล้ว';
                                                    }
                                                  } else {
                                                    return 'จองแล้ว';
                                                  }
                                                } catch (error) {
                                                  console.error('เกิดข้อผิดพลาดในการแสดงสถานะการจอง:', error);
                                                  return 'จองแล้ว';
                                                }
                                              })()}
                                            </span>
                                          </div>
                                          <div className="bg-white/10 rounded p-2">
                                            <div className="text-sm text-white mb-2 flex items-center">
                                              <svg className="h-3.5 w-3.5 mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                              </svg>
                                              <span className="font-medium text-green-200">{userName}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <div>
                                                {/* เลือกสถานะการจองด้วยการป้องกันความปลอดภัย */}
                                                {bookingDetail && bookingDetail._id && (
                                                  <select
                                                    value={bookingDetail.status || 'pending'}
                                                    onChange={(e) => handleUpdateBookingStatus(bookingDetail._id, e.target.value)}
                                                    className="text-xs bg-white/10 text-white border border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                                                  >
                                                    <option value="pending" className="bg-black text-yellow-300">รอดำเนินการ</option>
                                                    <option value="confirmed" className="bg-black text-green-300">ยืนยันแล้ว</option>
                                                    <option value="completed" className="bg-black text-blue-300">เสร็จสิ้น</option>
                                                    <option value="cancelled" className="bg-black text-red-300">ยกเลิก</option>
                                                  </select>
                                                )}
                                              </div>
                                              {bookingDetail && bookingDetail._id && (
                                                <button
                                                  onClick={() => handleDeleteBooking(bookingDetail._id)}
                                                  className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 flex items-center"
                                                >
                                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                                  ยกเลิกการจอง
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center text-sm text-indigo-300">
                                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>ว่าง (สามารถจองได้)</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 px-6 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
                            <svg className="mx-auto h-16 w-16 opacity-50 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-4 text-lg text-indigo-200">ไม่พบช่วงเวลาที่ตรงกับเงื่อนไขการค้นหา</p>
                            <p className="mt-2 text-sm text-indigo-300">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มตารางเวลาสอนใหม่</p>
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowAddSlotModal(true);
                              }}
                              className="mt-5 px-4 py-2 bg-indigo-600/40 text-indigo-200 rounded-lg hover:bg-indigo-600/60 inline-flex items-center transition-colors"
                            >
                              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              เพิ่มเวลาสอน
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        ครู
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        ผู้เรียน
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        วันที่เรียน
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        วันที่จอง
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {booking.teacher.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                          {booking.user.name || booking.user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                              {booking.date ? formatDate(booking.date) : dayTranslation[booking.day] || booking.day}
                          </div>
                          <div className="text-sm text-gray-400">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>
                            {statusTranslation[booking.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                          {new Date(booking.createdAt).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex justify-center">
                          <select
                            value={booking.status}
                            onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                            className="bg-transparent border border-white/20 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                              <option value="pending" className="bg-white text-black">รอดำเนินการ</option>
                              <option value="confirmed" className="bg-white text-black">ยืนยันแล้ว</option>
                              <option value="completed" className="bg-white text-black">เสร็จสิ้น</option>
                              <option value="cancelled" className="bg-white text-black">ยกเลิก</option>
                          </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">จัดการผู้ใช้</h2>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg shadow-lg hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  เพิ่มผู้ใช้ใหม่
                </button>
              </div>
              <div className="bg-white shadow-md rounded-lg p-6">
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ชื่อผู้ใช้</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ชื่อ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">รหัสผ่าน</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">บทบาท</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">จำนวนครั้งที่มี</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">จำนวนครั้งที่ใช้ไป</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">จัดการ</th>
                    </tr>
                  </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.name || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.password}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.totalLessons}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.usedLessons}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditUserModal(user)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={() => fetchUserBookingHistory(user._id)}
                                className="inline-flex items-center px-2 py-1 border border-indigo-500 rounded-md text-xs font-medium text-indigo-300 hover:bg-indigo-800/30 transition-colors"
                                title="ดูประวัติการจอง"
                              >
                                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                ประวัติ
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">เพิ่มครูใหม่</h3>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddTeacher}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  ชื่อ
                </label>
                <input
                  type="text"
                  id="name"
                  value={teacherFormData.name}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 bg-white text-gray-900"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="profileDescription" className="block text-sm font-medium text-gray-700">
                  คำอธิบาย
                </label>
                <textarea
                  id="profileDescription"
                  value={teacherFormData.profileDescription}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, profileDescription: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 bg-white text-gray-900"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  เพิ่มครู
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddSlotModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">เพิ่มเวลาสอนให้ {selectedTeacher.name}</h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSlot}>
              <div className="mb-4">
                <label htmlFor="selectedDate" className="block text-sm font-medium text-black">
                  วันที่
                </label>
                <input
                  type="date"
                  id="selectedDate"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 text-black"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  เลือกช่วงเวลา (เลือกได้หลายช่วง)
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {timeSlots.map((slot) => (
                    <div key={slot} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`slot-${slot}`}
                        name="timeSlot"
                        value={slot}
                        checked={selectedTimeSlots.includes(slot)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTimeSlots([...selectedTimeSlots, slot]);
                          } else {
                            setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot));
                          }
                        }}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                      />
                      <label htmlFor={`slot-${slot}`} className="ml-2 text-sm text-black">
                        {slot}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!selectedDate || selectedTimeSlots.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  เพิ่มเวลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal เพิ่มผู้ใช้ใหม่ */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">เพิ่มผู้ใช้ใหม่</h3>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">ชื่อ</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">รหัสผ่าน</label>
                <input
                  type="text"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">บทบาท</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="user" className="bg-white text-black">ผู้ใช้</option>
                  <option value="admin" className="bg-white text-black">แอดมิน</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">จำนวนครั้งที่มี</label>
                <input
                  type="number"
                  value={userFormData.totalLessons}
                  onChange={(e) => setUserFormData({ ...userFormData, totalLessons: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg shadow hover:from-pink-600 hover:to-purple-600"
                >
                  เพิ่มผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลผู้ใช้ */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">แก้ไขข้อมูลผู้ใช้: {selectedUser.username}</h3>
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">ชื่อ</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">รหัสผ่าน</label>
                <input
                  type="text"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">บทบาท</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="user" className="bg-white text-black">ผู้ใช้</option>
                  <option value="admin" className="bg-white text-black">แอดมิน</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">จำนวนครั้งที่มี</label>
                <input
                  type="number"
                  value={userFormData.totalLessons}
                  onChange={(e) => setUserFormData({ ...userFormData, totalLessons: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg shadow hover:from-pink-600 hover:to-purple-600"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* เพิ่ม Modal สำหรับเพิ่มการจอง */}
      {showAddBookingModal && selectedTeacherForBooking && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              เพิ่มการจองกับ {selectedTeacherForBooking.name}
              <div className="text-sm font-normal mt-1 text-indigo-300">
                {formatDate(selectedSlot.day)} เวลา {selectedSlot.startTime}-{selectedSlot.endTime}
              </div>
            </h3>
            <form onSubmit={handleAddBooking}>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">เลือกผู้ใช้</label>
                <select
                  value={selectedUserForBooking}
                  onChange={(e) => setSelectedUserForBooking(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="" className="bg-white text-black">-- เลือกผู้ใช้ --</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id} className="bg-white text-black">
                      {user.name || user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookingModal(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg shadow hover:from-pink-600 hover:to-purple-600"
                >
                  เพิ่มการจอง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* โมดอลแสดงประวัติการจอง */}
      {showBookingHistoryModal && userBookingHistory.summary && (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    ประวัติการจองของ {userBookingHistory.summary.userInfo.name}
                  </h3>
                  <button
                    onClick={() => setShowBookingHistoryModal(false)}
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
                      <p className="text-2xl font-bold text-white">{userBookingHistory.summary.total}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-yellow-500/20">
                      <p className="text-sm text-yellow-300">รอดำเนินการ</p>
                      <p className="text-2xl font-bold text-white">{userBookingHistory.summary.pending}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-300">ยืนยันแล้ว</p>
                      <p className="text-2xl font-bold text-white">{userBookingHistory.summary.confirmed}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-blue-500/20">
                      <p className="text-sm text-blue-300">เสร็จสิ้น</p>
                      <p className="text-2xl font-bold text-white">{userBookingHistory.summary.completed}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-red-500/20">
                      <p className="text-sm text-red-300">ยกเลิก</p>
                      <p className="text-2xl font-bold text-white">{userBookingHistory.summary.cancelled}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-indigo-200">
                      <p className="text-sm">จำนวนคาบทั้งหมด: <span className="font-semibold text-white">{userBookingHistory.summary.userInfo.totalLessons}</span></p>
                      <p className="text-sm">ใช้ไปแล้ว: <span className="font-semibold text-white">{userBookingHistory.summary.userInfo.usedLessons}</span></p>
                      <p className="text-sm">คงเหลือ: <span className="font-semibold text-white">{userBookingHistory.summary.userInfo.totalLessons - userBookingHistory.summary.userInfo.usedLessons}</span></p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleUpdateUserLessons(userBookingHistory.summary.userInfo._id, 
                          parseInt(prompt('กรุณาระบุจำนวนคาบเรียนใหม่', userBookingHistory.summary.userInfo.totalLessons.toString()) || '0'))}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm"
                      >
                        อัพเดทจำนวนคาบ
                      </button>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-indigo-300 uppercase">อัพเดทเมื่อ</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-indigo-300 uppercase">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {userBookingHistory.bookings.length > 0 ? (
                          userBookingHistory.bookings.map((booking: any) => (
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
                                  {booking.statusThai || booking.status}
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
                                {booking.statusUpdatedAt || new Date(booking.updatedAt || booking.createdAt).toLocaleDateString('th-TH')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                <div className="flex space-x-2 justify-end">
                                  <select
                                    value={booking.status}
                                    onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                                    className="text-xs bg-white/10 text-white border border-white/20 rounded-md focus:outline-none"
                                  >
                                    <option value="pending" className="bg-black text-yellow-300">รอดำเนินการ</option>
                                    <option value="confirmed" className="bg-black text-green-300">ยืนยันแล้ว</option>
                                    <option value="completed" className="bg-black text-blue-300">เสร็จสิ้น</option>
                                    <option value="cancelled" className="bg-black text-red-300">ยกเลิก</option>
                                  </select>
                                  <button
                                    onClick={() => handleDeleteBooking(booking._id)}
                                    className="text-red-300 hover:text-red-400"
                                    title="ลบการจอง"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-indigo-300">
                              ไม่พบประวัติการจอง
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* เพิ่มส่วนแสดงสถิติการจองรายเดือน */}
                {userBookingHistory.summary && userBookingHistory.summary.monthlyStats && userBookingHistory.summary.monthlyStats.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-white mb-3">สถิติการจองรายเดือน</h4>
                    <div className="bg-white/10 rounded-lg p-4 overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-indigo-300">เดือน</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-indigo-300">รวม</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-yellow-300">รอดำเนินการ</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-green-300">ยืนยันแล้ว</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-blue-300">เสร็จสิ้น</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-red-300">ยกเลิก</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-indigo-300">การหักคาบ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userBookingHistory.summary.monthlyStats.map((month: any, index: number) => (
                            <tr key={index} className="hover:bg-white/5">
                              <td className="px-4 py-2 text-sm text-white">{month.month}</td>
                              <td className="px-4 py-2 text-center text-sm text-white">{month.total}</td>
                              <td className="px-4 py-2 text-center text-sm text-yellow-300">{month.pending}</td>
                              <td className="px-4 py-2 text-center text-sm text-green-300">{month.confirmed}</td>
                              <td className="px-4 py-2 text-center text-sm text-blue-300">{month.completed}</td>
                              <td className="px-4 py-2 text-center text-sm text-red-300">{month.cancelled}</td>
                              <td className="px-4 py-2 text-center text-sm text-white">{month.deductedLessons}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;