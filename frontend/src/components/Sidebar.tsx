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
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 transition-all duration-300 z-30 shadow-xl dark:shadow-slate-900/50 ${isOpen ? 'w-64' : 'w-20'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              SmartGrocery
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
        {navigation.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isOpen ? '' : 'justify-center'
                } ${active
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
            >
              <IconComponent size={isOpen ? 20 : 24} className={active ? 'text-white' : ''} />
              {isOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden">
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-indigo-50 dark:bg-slate-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentUser?.email || 'user@example.com'}
                </p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  Role: {currentUser?.role || 'User'}
                </p>
              </div>
              <div className="p-2">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileDropdown(false);
                  }}
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
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
    </div>
  );
};

export default Sidebar;
