import React, { useState, useEffect } from 'react';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleStats,
  cloneRole,
  Role,
  CreateRoleData,
  UpdateRoleData,
  RoleFilters,
  RoleStats
} from '../services/roleService.ts';
import {
  getPermissions,
  Permission
} from '../services/permissionService.ts';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  RefreshCw,
  Download,
  Users,
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  AlertTriangle
} from 'lucide-react';

// Interfaces are now imported from services

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getRoles();

      if (response.success) {
        setRoles(response.data || []);
      } else {
        setError('Failed to fetch roles');
      }
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();
      if (response.success) {
        setPermissions(response.data || []);
        console.log('Fetched permissions:', response.data);
      } else {
        console.error('Failed to fetch permissions:', response.message);
      }
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleCreateRole = async () => {
    try {
      setLoading(true);
      setError('');

      const roleData: CreateRoleData = {
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      };

      const response = await createRole(roleData);

      if (response.success) {
        setRoles(prev => [response.data!, ...prev]);
        setShowRoleModal(false);
        resetNewRoleForm();
      } else {
        setError('Failed to create role');
      }
    } catch (err: any) {
      console.error('Error creating role:', err);
      setError(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (roleId: string, updates: UpdateRoleData) => {
    try {
      setLoading(true);
      setError('');

      const response = await updateRole(roleId, updates);

      if (response.success) {
        setRoles(prev => prev.map(role =>
          role._id === roleId ? response.data! : role
        ));
        setEditingRole(null);
      } else {
        setError('Failed to update role');
      }
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will be affected.')) return;

    try {
      setLoading(true);
      setError('');

      const response = await deleteRole(roleId);

      if (response.success) {
        setRoles(prev => prev.filter(role => role._id !== roleId));
      } else {
        setError('Failed to delete role');
      }
    } catch (err: any) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const resetNewRoleForm = () => {
    setNewRole({
      name: '',
      description: '',
      permissions: []
    });
  };

  const togglePermission = (permissionId: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getPermissionCategory = (category: string) => {
    switch (category) {
      case 'inventory': return { icon: Package, color: 'blue' };
      case 'sales': return { icon: ShoppingCart, color: 'green' };
      case 'users': return { icon: Users, color: 'purple' };
      case 'stores': return { icon: Store, color: 'orange' };
      case 'analytics': return { icon: BarChart3, color: 'indigo' };
      case 'settings': return { icon: Settings, color: 'gray' };
      default: return { icon: Shield, color: 'gray' };
    }
  };

  // Predefined role templates
  const roleTemplates = [
    {
      name: 'Manager',
      description: 'Management level access with most permissions',
      permissions: permissions.filter(p => p.level <= 5).map(p => p._id),
      color: 'blue'
    },
    {
      name: 'Cashier',
      description: 'Basic sales and inventory access',
      permissions: permissions.filter(p =>
        p.category === 'sales' ||
        p.category === 'inventory' && p.level <= 2
      ).map(p => p._id),
      color: 'green'
    },
    {
      name: 'Inventory Manager',
      description: 'Full inventory management access',
      permissions: permissions.filter(p =>
        p.category === 'inventory' ||
        p.category === 'analytics' && p.level <= 3
      ).map(p => p._id),
      color: 'purple'
    },
    {
      name: 'Sales Representative',
      description: 'Sales-focused role with customer interaction',
      permissions: permissions.filter(p =>
        p.category === 'sales' && p.level <= 2 ||
        p.category === 'inventory' && p.level <= 1
      ).map(p => p._id),
      color: 'orange'
    }
  ];

  const applyRoleTemplate = (template: typeof roleTemplates[0]) => {
    setNewRole({
      name: template.name,
      description: template.description,
      permissions: template.permissions
    });
    setShowQuickCreate(false);
    setShowRoleModal(true);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const permissionCategories = Array.from(new Set(permissions.map(p => p.category)));
  console.log('Permission categories:', permissionCategories);
  console.log('Total permissions:', permissions.length);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - Sticky and Compact */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Roles & Permissions
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage access control</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRoles}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowQuickCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5 font-medium"
              >
                <Shield size={18} />
                <span className="hidden sm:inline">Quick Create</span>
              </button>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 font-medium"
              >
                <Plus size={18} />
                New Role
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-lg shadow-gray-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{roles.length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 rounded-full text-xs font-bold text-white shadow-sm transition-transform hover:scale-105">
                    <Shield className="w-3 h-3" />
                    Active roles
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg shadow-gray-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{permissions.length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-600 rounded-full text-xs font-bold text-white shadow-sm transition-transform hover:scale-105">
                    <Check className="w-3 h-3" />
                    Available permissions
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg shadow-gray-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Default Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {roles.filter(role => role.isDefault).length}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 rounded-full text-xs font-bold text-white shadow-sm transition-transform hover:scale-105">
                    <Shield className="w-3 h-3" />
                    System roles
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg shadow-gray-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custom Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.filter(role => !role.isDefault).length}
                </p>
                <p className="text-xs text-orange-600">User-created</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-lg shadow-gray-500/5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Roles Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading roles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <div key={role._id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-lg shadow-gray-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingRole(role)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Role"
                    >
                      <Edit size={16} />
                    </button>
                    {!role.isDefault && (
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Role"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Permissions</span>
                    <span className="font-medium text-gray-900 dark:text-white">{role.permissions.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Users</span>
                    <span className="font-medium text-gray-900 dark:text-white">{role.userCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Type</span>
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${role.isDefault ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                      {role.isDefault ? 'System' : 'Custom'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permissionId) => {
                      const permission = permissions.find(p => p._id === permissionId);
                      return permission ? (
                        <span key={permissionId} className="inline-flex items-center px-2 py-0.5 text-[10px] bg-slate-600 text-white rounded-full font-medium">
                          {permission.name}
                        </span>
                      ) : null;
                    })}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRoles.length === 0 && !loading && (
          <div className="text-center py-16">
            <Shield className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
            <p className="text-gray-500">Try adjusting your search or create a new role.</p>
          </div>
        )}
      </div>

      {/* New Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create New Role</h2>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter role name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newRole.description}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter role description"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions ({permissions.length} available)
                  </label>
                  {permissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No permissions available. Please check if permissions are seeded in the database.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {permissionCategories.map(category => {
                        const categoryPermissions = permissions.filter(p => p.category === category);
                        const { icon: Icon, color } = getPermissionCategory(category);

                        return (
                          <div key={category} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 text-${color}-500`} />
                              <h4 className="font-medium text-gray-900 capitalize">
                                {category} ({categoryPermissions.length})
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {categoryPermissions.map(permission => (
                                <label key={permission._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={newRole.permissions.includes(permission._id)}
                                    onChange={() => togglePermission(permission._id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm text-gray-700 font-medium">{permission.name}</span>
                                    <p className="text-xs text-gray-500">{permission.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={loading || !newRole.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Role Details</h2>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedRole.name}</h3>
                    <p className="text-gray-500">{selectedRole.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-gray-900">{selectedRole.isDefault ? 'System Role' : 'Custom Role'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Users</p>
                    <p className="text-gray-900">{selectedRole.userCount} users</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Permissions</p>
                    <p className="text-gray-900">{selectedRole.permissions.length} permissions</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-gray-900">{new Date(selectedRole.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">Assigned Permissions</p>
                  <div className="space-y-2">
                    {selectedRole.permissions.map(permissionId => {
                      const permission = permissions.find(p => p._id === permissionId);
                      if (!permission) return null;

                      const { icon: Icon, color } = getPermissionCategory(permission.category);

                      return (
                        <div key={permissionId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Icon className={`w-4 h-4 text-${color}-500`} />
                          <div>
                            <p className="font-medium text-gray-900">{permission.name}</p>
                            <p className="text-sm text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Role</h2>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                    <input
                      type="text"
                      value={editingRole.name}
                      onChange={(e) =>
                        setEditingRole({ ...editingRole, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editingRole.description}
                      onChange={(e) =>
                        setEditingRole({ ...editingRole, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions ({permissions.length} available)
                  </label>
                  {permissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No permissions available. Please check if permissions are seeded in the database.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {permissionCategories.map((category) => {
                        const categoryPermissions = permissions.filter(
                          (p) => p.category === category
                        );
                        const { icon: Icon, color } = getPermissionCategory(category);

                        return (
                          <div
                            key={category}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 text-${color}-500`} />
                              <h4 className="font-medium text-gray-900 capitalize">
                                {category} ({categoryPermissions.length})
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {categoryPermissions.map((permission) => (
                                <label
                                  key={permission._id}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingRole.permissions.includes(permission._id)}
                                    onChange={() => {
                                      const updated = editingRole.permissions.includes(permission._id)
                                        ? editingRole.permissions.filter((id) => id !== permission._id)
                                        : [...editingRole.permissions, permission._id];
                                      setEditingRole({ ...editingRole, permissions: updated });
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm text-gray-700 font-medium">
                                      {permission.name}
                                    </span>
                                    <p className="text-xs text-gray-500">{permission.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditingRole(null)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleUpdateRole(editingRole._id, {
                      name: editingRole.name,
                      description: editingRole.description,
                      permissions: editingRole.permissions,
                    })
                  }
                  disabled={loading || !editingRole.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Quick Create Role</h2>
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => applyRoleTemplate(template)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 bg-gradient-to-r from-${template.color}-500 to-${template.color}-600 rounded-lg`}>
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {template.permissions.length} permissions included
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Roles; 