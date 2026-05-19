import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  CheckCircle,
  X,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Store,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  AlertCircle
} from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  searchUsers,
  bulkUpdateUsers,
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  UserStats
} from '../services/userService.ts';
import StatsCard from './StatsCard.tsx';

interface Store {
  _id: string;
  name: string;
  address?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  store: string;
  phone: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters and search
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    store: '',
    isActive: undefined
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals and forms
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  // Form data
  const [userForm, setUserForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    store: '',
    phone: '',
    isActive: true
  });

  const [editForm, setEditForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    store: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
    fetchStores();
    fetchStats();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUsers(filters);

      if (response.success && response.data) {
        setUsers(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalUsers(response.totalUsers || 0);
        setCurrentPage(response.currentPage || 1);
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await (await import('../api/axiosInstance.ts')).default.get('/stores');
      const data: any = res.data?.data || res.data;
      if (Array.isArray(data)) setStores(data);
    } catch (err: any) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getUserStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const userData: CreateUserData = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        store: userForm.store || undefined,
        phone: userForm.phone || undefined,
        isActive: userForm.isActive
      };

      const response = await createUser(userData);

      if (response.success) {
        setSuccess('User created successfully!');
        setShowUserModal(false);
        resetUserForm();
        fetchUsers();
        fetchStats();
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updateData: UpdateUserData = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        store: editForm.store || undefined,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive
      };

      const response = await updateUser(selectedUser._id, updateData);

      if (response.success) {
        setSuccess('User updated successfully!');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats();
      } else {
        setError(response.message || 'Failed to update user');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDeleteId(userId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDeleteId) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await deleteUser(userToDeleteId);

      if (response.success) {
        setSuccess('User deleted successfully!');
        fetchUsers();
        fetchStats();
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false);
      setUserToDeleteId(null);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await toggleUserStatus(userId);

      if (response.success) {
        setSuccess(`User ${response.data?.isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchUsers();
        fetchStats();
      } else {
        setError(response.message || 'Failed to toggle user status');
      }
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setError(err.message || 'Failed to toggle user status');
    } finally {
      setLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      store: '',
      phone: '',
      isActive: true
    });
  };

  const resetEditForm = () => {
    setEditForm({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      store: '',
      phone: '',
      isActive: true
    });
  };

  // Filter and search handlers
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    handleFilterChange('page', page);
  };

  // Bulk operations
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleBulkUpdate = async (updates: Partial<UpdateUserData>) => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await bulkUpdateUsers(selectedUsers, updates);

      if (response.success) {
        setSuccess(`${response.data?.modifiedCount || 0} users updated successfully!`);
        setShowBulkModal(false);
        setSelectedUsers([]);
        fetchUsers();
        fetchStats();
      } else {
        setError(response.message || 'Failed to bulk update users');
      }
    } catch (err: any) {
      console.error('Error bulk updating users:', err);
      setError(err.message || 'Failed to bulk update users');
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      store: user.store?._id || '',
      phone: user.phone || '',
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const openUserModal = () => {
    resetUserForm();
    setShowUserModal(true);
  };

  // Utility functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-700 text-white border-red-700';
      case 'manager': return 'bg-blue-700 text-white border-blue-700';
      case 'staff': return 'bg-green-700 text-white border-green-700';
      default: return 'bg-slate-700 text-white border-slate-700';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-600 text-white border-green-600'
      : 'bg-slate-500 text-white border-slate-500';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'manager': return <Store className="w-4 h-4" />;
      case 'staff': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="page-container py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">User Management</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage team identities, access levels, and store assignments</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 rounded-lg">
                  <span className="text-xs font-semibold">{selectedUsers.length} Selected</span>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              )}

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={openUserModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold text-sm shadow-sm active:scale-95"
              >
                <UserPlus size={18} />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container space-y-4 sm:space-y-6 lg:space-y-8">

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={String(stats?.totalUsers || 0)}
            icon={Users}
            color="blue"
            subtitle="total accounts"
          />
          <StatsCard
            title="Active Users"
            value={String(stats?.activeUsers || 0)}
            icon={UserCheck}
            color="emerald"
            subtitle="linked accounts"
          />
          <StatsCard
            title="Managers"
            value={String(stats?.managerUsers || 0)}
            icon={Shield}
            color="blue"
            subtitle="store management"
          />
          <StatsCard
            title="Staff Members"
            value={String(stats?.staffUsers || 0)}
            icon={UserPlus}
            color="blue"
            subtitle="operational personnel"
          />
        </div>

        {/* User Search & Filters */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm overflow-hidden relative group">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              <div className="relative group/search flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search users by name, email..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-semibold appearance-none cursor-pointer pr-8"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>

                <select
                  value={filters.store || ''}
                  onChange={(e) => handleFilterChange('store', e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-semibold appearance-none cursor-pointer pr-8"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
                </select>

                <select
                  value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-semibold appearance-none cursor-pointer pr-8"
                >
                  <option value="">All Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:text-blue-600 transition-all active:scale-95 shadow-sm">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Notifications Matrix */}
        <div className="space-y-4">
          {success && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center gap-4 font-bold uppercase tracking-widest text-xs">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-3xl flex items-center gap-4 font-bold uppercase tracking-widest text-xs animate-pulse">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Personnel Matrix Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <span className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-tight">Syncing User Database...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">User Details</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Access Level</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Store Location</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Last Activity</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {users.map((user) => (
                    <tr key={user._id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-all">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400 text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{user.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${user.role === 'admin'
                          ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                          : user.role === 'manager'
                            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-red-500' : user.role === 'manager' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                          <span className="capitalize">{user.role}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {user.store ? user.store.name : 'All Locations'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user._id)}
                            className={`p-2 rounded-lg transition-all ${user.isActive ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              }`}
                          >
                            {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Segment */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  Showing {((currentPage - 1) * (filters.limit || 10)) + 1} to {Math.min(currentPage * (filters.limit || 10), totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages || pageNum < 1) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add New User</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    >
                      <option value="staff">Staff Member</option>
                      <option value="manager">Store Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Store</label>
                    <select
                      value={userForm.store}
                      onChange={(e) => setUserForm(prev => ({ ...prev, store: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Store (Optional)</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    User is active and can log in
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={loading || !userForm.name || !userForm.email || !userForm.password}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit User</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    >
                      <option value="staff">Staff Member</option>
                      <option value="manager">Store Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Store</label>
                    <select
                      value={editForm.store}
                      onChange={(e) => setEditForm(prev => ({ ...prev, store: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Store (Optional)</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="editIsActive" className="text-sm text-gray-700">
                    User is active and can log in
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={loading || !editForm.name || !editForm.email}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && !showEditModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Role</p>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(selectedUser.role)}
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(selectedUser.isActive)}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Store</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedUser.store ? selectedUser.store.name : 'All Stores'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 px-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Last Login</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                      {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never logged in'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Created</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => openEditModal(selectedUser)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium shadow-md shadow-blue-200 dark:shadow-none"
                >
                  <Edit className="w-4 h-4" />
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md my-auto overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bulk Operations</h2>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleBulkUpdate({ isActive: true })}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate Selected Users
                  </button>

                  <button
                    onClick={() => handleBulkUpdate({ isActive: false })}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <UserX className="w-4 h-4" />
                    Deactivate Selected Users
                  </button>

                  <button
                    onClick={() => handleBulkUpdate({ role: 'staff' })}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Users className="w-4 h-4" />
                    Set Role to Staff
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedUsers([]);
                    setShowBulkModal(false);
                  }}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && userToDeleteId && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md my-auto overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Confirm Deletion</h2>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete user "{users.find(u => u._id === userToDeleteId)?.name || 'this user'}"? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
