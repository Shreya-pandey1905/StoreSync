import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService.ts';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext.tsx';

interface NavbarProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  onSidebarToggle,
  sidebarOpen
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get current user data and profile image
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    // Load profile image from localStorage
    if (user) {
      const savedImage = localStorage.getItem(`profileImage_${user.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, []);

  // Listen for profile image updates
  useEffect(() => {
    const handleStorageChange = () => {
      if (currentUser) {
        const savedImage = localStorage.getItem(`profileImage_${currentUser.id}`);
        setProfileImage(savedImage);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileImageUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleStorageChange);
    };
  }, [currentUser]);

  const notifications = [
    { id: 1, message: 'Low stock alert: Rice is running low', time: '2 min ago', unread: true },
    { id: 2, message: 'New sale recorded: $150.00', time: '5 min ago', unread: true },
    { id: 3, message: 'Inventory update completed', time: '1 hour ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 min-h-[56px]">

        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all lg:hidden flex-shrink-0"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="relative hidden sm:block flex-1 max-w-sm lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
            aria-label={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-3.5 px-1 flex items-center justify-center font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 flex-shrink-0 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
