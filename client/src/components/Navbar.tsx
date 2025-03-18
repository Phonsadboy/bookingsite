import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled 
          ? 'bg-white text-indigo-900 shadow-lg' 
          : 'bg-transparent text-white'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 ${
          scrolled 
            ? 'opacity-100 bg-white' 
            : 'bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-800/80 backdrop-blur-lg'
        }`}></div>
        {!scrolled && (
          <>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          </>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className={`flex items-center text-2xl font-bold transition-all duration-300 ${scrolled ? 'text-indigo-900' : 'text-white'}`}>
                <span className={`
                  px-2 py-1 rounded-lg mr-1 transition-all duration-300 
                  ${scrolled 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                    : 'bg-white text-indigo-600'
                  }
                `}>Brainstorm</span>
                <span>Bookings</span>
              </Link>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/teachers" 
                className={`
                  relative overflow-hidden group px-1 pt-1 text-sm font-medium transition-all duration-300
                  ${isActive('/teachers') 
                    ? (scrolled ? 'text-indigo-600' : 'text-white') 
                    : (scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-indigo-100 hover:text-white')
                  }
                `}
              >
                <span>ครูของเรา</span>
                <span className={`
                  absolute bottom-0 left-0 w-full h-0.5 transition-all duration-300 transform 
                  ${isActive('/teachers') 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-x-100' 
                    : 'scale-x-0 group-hover:scale-x-100'
                  }
                  ${scrolled 
                    ? 'from-indigo-600 to-purple-600' 
                    : 'from-pink-400 to-purple-400'
                  }
                `}></span>
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/my-bookings" 
                    className={`
                      relative overflow-hidden group px-1 pt-1 text-sm font-medium transition-all duration-300
                      ${isActive('/my-bookings') 
                        ? (scrolled ? 'text-indigo-600' : 'text-white') 
                        : (scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-indigo-100 hover:text-white')
                      }
                    `}
                  >
                    <span>การจองของฉัน</span>
                    <span className={`
                      absolute bottom-0 left-0 w-full h-0.5 transition-all duration-300 transform 
                      ${isActive('/my-bookings') 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-x-100' 
                        : 'scale-x-0 group-hover:scale-x-100'
                      }
                      ${scrolled 
                        ? 'from-indigo-600 to-purple-600' 
                        : 'from-pink-400 to-purple-400'
                      }
                    `}></span>
                  </Link>
                  
                  {user?.role === 'admin' && (
                    <Link to="/admin" 
                      className={`
                        relative overflow-hidden group px-1 pt-1 text-sm font-medium transition-all duration-300
                        ${isActive('/admin') 
                          ? (scrolled ? 'text-indigo-600' : 'text-white') 
                          : (scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-indigo-100 hover:text-white')
                        }
                      `}
                    >
                      <span>แดชบอร์ดผู้ดูแล</span>
                      <span className={`
                        absolute bottom-0 left-0 w-full h-0.5 transition-all duration-300 transform 
                        ${isActive('/admin') 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-x-100' 
                          : 'scale-x-0 group-hover:scale-x-100'
                        }
                        ${scrolled 
                          ? 'from-indigo-600 to-purple-600' 
                          : 'from-pink-400 to-purple-400'
                        }
                      `}></span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className={`
                  relative overflow-hidden rounded-lg px-4 py-2 text-sm transition-all duration-300
                  ${scrolled 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'bg-indigo-800 bg-opacity-50 text-white'
                  }
                `}>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-medium">{user?.username}</span>
                    <span className="text-xs">•</span>
                    <span>เหลือ <span className="font-semibold">{user?.totalLessons && user?.usedLessons !== undefined ? user.totalLessons - user.usedLessons : 0}</span>/<span className="font-semibold">{user?.totalLessons || 0}</span> คาบ</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: `${user?.totalLessons && user?.usedLessons !== undefined ? (user.usedLessons / user.totalLessons) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className={`
                    relative overflow-hidden group inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-all duration-300
                    ${scrolled 
                      ? 'border-indigo-100 text-indigo-700 hover:border-indigo-600 hover:text-indigo-600' 
                      : 'border-white/20 text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`
                  group relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg overflow-hidden transition-all duration-300
                  ${scrolled 
                    ? 'text-white' 
                    : 'text-indigo-700'
                  }
                `}
              >
                <span className={`
                  absolute inset-0 
                  ${scrolled 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                    : 'bg-white'
                  }
                `}></span>
                <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                <span className="relative flex items-center">
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  เข้าสู่ระบบ
                </span>
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {isAuthenticated && (
              <div className="relative mr-3">
                <button
                  onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                  className={`inline-flex items-center justify-center p-2 rounded-full focus:outline-none transition-all duration-300 ${
                    scrolled ? 'text-indigo-600 bg-indigo-50' : 'text-white bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {mobileProfileOpen && (
                  <div className={`
                    absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 z-50 transition-all duration-300
                    ${scrolled ? 'bg-white text-gray-800' : 'bg-indigo-900 text-white'}
                  `}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-medium">{user?.username}</div>
                      <div className="text-xs opacity-75">
                        เหลือ {user?.totalLessons && user?.usedLessons !== undefined ? user.totalLessons - user.usedLessons : 0}/{user?.totalLessons || 0} คาบ
                      </div>
                      <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: `${user?.totalLessons && user?.usedLessons !== undefined ? (user.usedLessons / user.totalLessons) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div className="px-2 py-2">
                      <button
                        onClick={() => {
                          logout();
                          setMobileProfileOpen(false);
                        }}
                        className={`
                          flex w-full items-center px-3 py-2 text-sm rounded-md transition-colors duration-200
                          ${scrolled ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-white/10'}
                        `}
                      >
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none transition-colors duration-300 ${
                scrolled 
                  ? 'text-indigo-600 hover:bg-indigo-50' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`
        md:hidden transition-all duration-500 ease-in-out overflow-hidden
        ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className={`
          relative px-2 pt-2 pb-3 space-y-1 transition-all duration-300
          ${scrolled ? 'bg-white' : 'bg-indigo-900 bg-opacity-95 backdrop-blur-lg'}
        `}>
          <Link
            to="/teachers"
            className={`
              block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
              ${isActive('/teachers') 
                ? (scrolled ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-800 text-white') 
                : (scrolled ? 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600' : 'text-indigo-100 hover:bg-indigo-800 hover:text-white')
              }
            `}
            onClick={() => setIsMenuOpen(false)}
          >
            ครูของเรา
          </Link>
          
          {isAuthenticated && (
            <>
              <Link
                to="/my-bookings"
                className={`
                  block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                  ${isActive('/my-bookings') 
                    ? (scrolled ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-800 text-white') 
                    : (scrolled ? 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600' : 'text-indigo-100 hover:bg-indigo-800 hover:text-white')
                  }
                `}
                onClick={() => setIsMenuOpen(false)}
              >
                การจองของฉัน
              </Link>
              
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`
                    block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                    ${isActive('/admin') 
                      ? (scrolled ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-800 text-white') 
                      : (scrolled ? 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600' : 'text-indigo-100 hover:bg-indigo-800 hover:text-white')
                    }
                  `}
                  onClick={() => setIsMenuOpen(false)}
                >
                  แดชบอร์ดผู้ดูแล
                </Link>
              )}
            </>
          )}
          
          {!isAuthenticated && (
            <div className="px-3 py-3">
              <Link
                to="/login"
                className="block w-full text-center px-4 py-2 rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;