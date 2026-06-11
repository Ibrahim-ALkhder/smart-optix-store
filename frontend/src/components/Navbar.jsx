import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, Globe, LogOut, User, LayoutDashboard, ChevronDown, Bell, Sun, Moon, Truck, Package, Calendar, BarChart3, AlertTriangle, Boxes } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { user, logout, isAdmin, isDriver } = useAuth();
  const { getItemCount } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // ===== CLIENT NAV LINKS =====
  const clientNavLinks = [
    { to: '/', label: t('home') },
    { to: '/catalog', label: t('catalog') },
    { to: '/appointments', label: t('appointments') },
    { to: '/face-guide', label: t('faceGuide') },
  ];

  // ===== ADMIN NAV LINKS =====
  const adminNavLinks = [
    { to: '/admin', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
  ];

  // ===== DRIVER NAV LINKS =====
  const driverNavLinks = [
    { to: '/driver', label: language === 'ar' ? 'لوحة التوصيل' : 'Deliveries', icon: Truck },
  ];

  const navLinks = isAdmin ? adminNavLinks : isDriver ? driverNavLinks : clientNavLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm transition-colors duration-300"
      style={{
        backgroundColor: isDark ? 'rgba(11,11,12,0.92)' : 'rgba(255,255,255,0.92)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : isDriver ? '/driver' : '/'} className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg gold-gradient">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} font-inter hidden sm:inline`}>
              {t('smartOptix')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive(link.to)
                    ? isDark ? 'bg-white/10 text-gold-400' : 'bg-primary-100 text-primary-700'
                    : isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {link.icon && <link.icon size={14} />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
            {/* Language Toggle */}
            <button onClick={toggleLanguage}
              className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm font-medium ${
                isDark ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
              title={language === 'en' ? 'العربية' : 'English'}>
              <Globe size={18} />
              <span className="hidden sm:inline text-xs">{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark ? 'text-gold-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
              title={isDark ? 'Light Mode' : 'Dark Mode'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifMenuRef}>
                <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAsRead(); }}
                  className={`relative p-2 rounded-lg transition-all duration-200 ${
                    isDark ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}>
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 rounded-2xl shadow-2xl border py-2 z-50 animate-slide-down max-h-96 overflow-y-auto ${
                      isDark ? 'bg-[#141416] border-white/10' : 'bg-white border-gray-200'
                    }`}>
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('notifications')}</p>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={24} className={`mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('noNotifications')}</p>
                        </div>
                      ) : notifications.slice(0, 10).map(notif => (
                        <div key={notif.id} className={`px-4 py-3 border-b transition-colors cursor-pointer ${
                          isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'
                        } ${!notif.is_read ? (isDark ? 'bg-gold-500/5' : 'bg-primary-50/50') : ''}`}>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</p>
                          <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(notif.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cart — clients only */}
            {!isAdmin && !isDriver && (
              <Link to="/cart"
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  isDark ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`}>
                <ShoppingCart size={20} />
                {getItemCount() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-midnight-900 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-md">
                    {getItemCount()}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu / Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg transition-all duration-200 ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100/80'
                  }`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center gold-gradient shadow-md">
                    <span className="text-white text-sm font-bold">{user.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <ChevronDown size={14} className={`hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 rounded-2xl shadow-2xl border py-2 z-50 animate-fade-in ${
                      isDark ? 'bg-[#141416] border-white/10' : 'bg-white border-gray-200'
                    }`}>
                      {/* User info header */}
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.full_name || user.name}</p>
                        <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.email}</p>
                      </div>
                      {/* Role-specific links */}
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                          }`}>
                          <LayoutDashboard size={16} className="text-gold-500" /> {t('adminDashboard')}
                        </Link>
                      )}
                      {isDriver && (
                        <Link to="/driver" onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                          }`}>
                          <Truck size={16} className="text-gold-500" /> {t('driverPortal')}
                        </Link>
                      )}
                      {!isAdmin && !isDriver && (
                        <>
                          <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                            }`}>
                            <LayoutDashboard size={16} className="text-gold-500" /> {t('dashboard')}
                          </Link>
                          <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                            }`}>
                            <Package size={16} className="text-gold-500" /> {t('myOrders')}
                          </Link>
                        </>
                      )}
                      <div className={`border-t my-1 ${isDark ? 'border-white/10' : 'border-gray-100'}`} />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                        <LogOut size={16} /> {t('logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                <Link to="/login"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isDark ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}>
                  {t('login')}
                </Link>
                <Link to="/register"
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 gold-gradient">
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100/80'
              }`}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className={`md:hidden py-3 border-t animate-fade-in ${
            isDark ? 'border-white/10' : 'border-gray-100'
          }`}>
            <div className="flex flex-col space-y-0.5">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive(link.to)
                      ? isDark ? 'bg-white/10 text-gold-400' : 'bg-primary-100 text-primary-700'
                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100/80'
                  }`}>
                  {link.icon && <link.icon size={16} />}
                  {link.label}
                </Link>
              ))}
              {/* Mobile: Dashboard link for clients */}
              {user && !isAdmin && !isDriver && (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100/80'
                  }`}>
                  <LayoutDashboard size={16} /> {t('dashboard')}
                </Link>
              )}
              {!user && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100/80'}`}>
                    {t('login')}
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}
                    className="mx-4 py-2.5 rounded-lg text-sm font-medium text-midnight-900 bg-gold-500 text-center">
                    {t('register')}
                  </Link>
                </>
              )}
              {user && (
                <button onClick={() => { handleLogout(); }}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 text-left rtl:text-right flex items-center gap-2">
                  <LogOut size={16} /> {t('logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
