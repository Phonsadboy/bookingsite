import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "ค้นหาครูที่เหมาะกับคุณ",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      ),
      description: "ค้นหาและเลือกครูที่ตรงกับความต้องการและระดับความสามารถของคุณได้อย่างง่ายดาย"
    },
    {
      title: "จองเวลาเรียนได้ทันที",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      ),
      description: "เลือกวันและเวลาที่สะดวกสำหรับคุณ จองคาบเรียนได้ทันทีไม่ต้องรอการติดต่อกลับ"
    },
    {
      title: "เรียนออนไลน์ทุกที่ทุกเวลา",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      ),
      description: "เรียนได้จากทุกที่ผ่านระบบออนไลน์ที่ทันสมัย สะดวกสบายตามไลฟ์สไตล์ของคุณ"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
      {/* Hero section with animated background */}
      <div className="relative overflow-hidden pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-30"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="bg-white text-indigo-600 text-2xl sm:text-3xl font-bold px-3 py-2 rounded-lg mr-2 shadow-lg">
                  Brainstorm
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white">
                  Bookings
                </div>
              </div>
              
              <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                <span className="block">จองเวลาเรียนได้ทุกที่</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-300">
                  ทุกเวลาที่ต้องการ
                </span>
              </h1>
              
              <p className="max-w-xl mt-4 sm:mt-6 mx-auto text-base sm:text-xl text-indigo-100">
                เชื่อมต่อกับครูผู้เชี่ยวชาญและจัดตารางเรียนตามความสะดวกของคุณได้ในไม่กี่คลิก
              </p>
              
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:space-x-6">
                {isAuthenticated ? (
                  <Link
                    to="/teachers"
                    className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 font-medium rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                    <span className="relative flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      ดูรายชื่อครูทั้งหมด
                    </span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 font-medium rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                    <span className="relative flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                      </svg>
                      เริ่มต้นใช้งาน
                    </span>
                  </Link>
                )}
                
                <Link
                  to={isAuthenticated ? "/my-bookings" : "/teachers"}
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 font-medium rounded-full overflow-hidden bg-indigo-100 text-indigo-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                  <span className="relative flex items-center">
                    {isAuthenticated ? "การจองของฉัน" : "เกี่ยวกับเรา"}
                  </span>
                </Link>
              </div>
              
              {isAuthenticated && user && (
                <div className="mt-12 sm:mt-16 max-w-lg mx-auto p-1 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-xl transform transition duration-500 hover:scale-105">
                  <div className="bg-white rounded-xl p-4 sm:p-6 backdrop-blur-xl bg-opacity-90">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">สถานะคอร์สเรียนของคุณ</h3>
                    
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 sm:p-4 rounded-lg text-center text-white">
                        <div className="text-lg sm:text-2xl font-bold">{user.usedLessons}</div>
                        <div className="text-xs font-medium mt-1">ใช้ไปแล้ว</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 sm:p-4 rounded-lg text-center text-white">
                        <div className="text-lg sm:text-2xl font-bold">{user.totalLessons - user.usedLessons}</div>
                        <div className="text-xs font-medium mt-1">คงเหลือ</div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-500 to-indigo-500 p-3 sm:p-4 rounded-lg text-center text-white">
                        <div className="text-lg sm:text-2xl font-bold">{user.totalLessons}</div>
                        <div className="text-xs font-medium mt-1">ทั้งหมด</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="relative pt-1">
                        <div className="text-right mb-1">
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            {Math.round((user.usedLessons / user.totalLessons) * 100)}%
                          </span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200">
                          <div 
                            style={{ width: `${(user.usedLessons / user.totalLessons) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Link
                        to="/my-bookings"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        ดูการจองของฉัน
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Features section with animated cards */}
      <div className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-800 to-purple-900"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-base text-pink-400 font-semibold tracking-wide uppercase">คุณสมบัติ</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white sm:text-4xl">
              ทำไมต้องเลือกใช้บริการของเรา
            </p>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-indigo-200 mx-auto">
              ระบบจองคอร์สเรียนออนไลน์ที่ออกแบบมาเพื่อประสบการณ์การใช้งานที่ดีที่สุดสำหรับคุณ
            </p>
          </div>

          {/* Feature cards */}
          <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`
                  relative overflow-hidden rounded-2xl transition-all duration-500 
                  ${activeFeature === index ? 'transform scale-105 shadow-2xl z-10' : 'bg-opacity-70 z-0'} 
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
                style={{ 
                  transitionDelay: `${index * 200}ms`,
                  background: `linear-gradient(135deg, rgba(79, 70, 229, 0.8) 0%, rgba(147, 51, 234, 0.8) 100%)`,
                }}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-white opacity-5"></div>
                <div className="relative p-6 sm:p-8">
                  <div className={`
                    inline-flex items-center justify-center p-3 bg-white bg-opacity-10 rounded-xl text-white mb-4 sm:mb-5
                    ${activeFeature === index ? 'animate-pulse' : ''}
                  `}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-indigo-100">
                    {feature.description}
                  </p>
                </div>
                <div className={`
                  absolute bottom-0 left-0 right-0 h-1
                  ${activeFeature === index ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-transparent'}
                `}></div>
              </div>
            ))}
          </div>
          
          {/* Call to action */}
          <div className="mt-16 sm:mt-20 text-center">
            <Link
              to={isAuthenticated ? "/teachers" : "/login"}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-xl transform transition-all duration-300 hover:scale-105"
            >
              {isAuthenticated ? "ค้นหาครูตอนนี้" : "สมัครใช้งานตอนนี้"}
              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
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

export default Home;