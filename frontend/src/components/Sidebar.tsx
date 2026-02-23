import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { getCurrentUser, logout } from '../services/authService.ts';
import PermissionGuard from './PermissionGuard.tsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, resource: 'dashboard' },
    { name: 'Inventory', href: '/inventory', icon: Package, resource: 'products' },
    { name: 'Sales', href: '/sales', icon: ShoppingCart, resource: 'sales' },
    { name: 'Suppliers', href: '/suppliers', icon: Truck, resource: 'suppliers' },
    { name: 'Users', href: '/users', icon: Users, resource: 'users' },
    { name: 'Roles', href: '/roles', icon: Shield, resource: 'roles' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, resource: 'analytics' },
    { name: 'Settings', href: '/settings', icon: Settings, resource: 'settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 shadow-lg
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
      `}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
        {isOpen && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-lg flex-shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              StoreSync
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all hidden lg:flex flex-shrink-0"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="p-2 sm:p-3 space-y-0.5 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
        {navigation.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className={`flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all ${isOpen ? '' : 'lg:justify-center'
                } ${active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600'
                }`}
            >
              <IconComponent size={isOpen ? 20 : 22} className="flex-shrink-0" />
              {isOpen && <span className="font-medium text-sm sm:text-base truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            {isOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform text-gray-400 ${showProfileDropdown ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && isOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.email || 'user@example.com'}
                </p>
                <p className="text-xs mt-1 text-slate-500">
                  Role: {currentUser?.role || 'User'}
                </p>
              </div>
              <div className="p-2">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileDropdown(false);
                  }}
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileDropdown(false);
                  }}
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
