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
      case 'users': return { icon: Users, color: 'blue' };
      case 'stores': return { icon: Store, color: 'amber' };
      case 'analytics': return { icon: BarChart3, color: 'blue' };
      case 'settings': return { icon: Settings, color: 'slate' };
      default: return { icon: Shield, color: 'slate' };
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
      color: 'blue'
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header - Sticky and Compact */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="page-container py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Roles &amp; Permissions</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage access control</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRoles}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowQuickCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-sm font-medium shadow-sm"
              >
                <Shield size={16} className="text-blue-500" />
                <span className="hidden sm:inline">Quick Create</span>
              </button>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-medium shadow-md shadow-blue-200 dark:shadow-none"
              >
                <Plus size={18} />
                New Role
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Roles</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{roles.length}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Active roles</p>
              </div>
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Permissions</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{permissions.length}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Available permissions</p>
              </div>
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Default Roles</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {roles.filter(role => role.isDefault).length}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">System roles</p>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Custom Roles</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {roles.filter(role => !role.isDefault).length}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">User-created</p>
              </div>
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Plus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all font-medium">
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
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">Loading roles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <div key={role._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingRole(role)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                      title="Edit Role"
                    >
                      <Edit size={16} />
                    </button>
                    {!role.isDefault && (
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Permissions</span>
                    <span className="font-medium text-slate-900 dark:text-white">{role.permissions.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Users</span>
                    <span className="font-medium text-slate-900 dark:text-white">{role.userCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${role.isDefault
                      ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50'
                      }`}>
                      {role.isDefault ? 'System' : 'Custom'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permissionId) => {
                      const permission = permissions.find(p => p._id === permissionId);
                      return permission ? (
                        <span key={permissionId} className="inline-flex items-center px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium border border-slate-200 dark:border-slate-600">
                          {permission.name}
                        </span>
                      ) : null;
                    })}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium">
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
            <Shield className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">No roles found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or create a new role.</p>
          </div>
        )}
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create New Role</h2>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Role Details */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role Name *</label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                      placeholder="e.g. Senior Manager"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                    <textarea
                      value={newRole.description}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                      placeholder="Briefly describe what this role can do..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
                    <span>Permissions</span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                      {newRole.permissions.length} selected
                    </span>
                  </label>
                  {permissions.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Shield className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No permissions found in the system.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {permissionCategories.map(category => {
                        const categoryPermissions = permissions.filter(p => p.category === category);
                        const { icon: Icon, color } = getPermissionCategory(category);

                        return (
                          <div key={category} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-slate-100/50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                              <Icon className={`w-4 h-4 text-blue-500 dark:text-blue-400`} />
                              <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                                {category}
                              </h4>
                            </div>
                            <div className="p-2 space-y-1">
                              {categoryPermissions.map(permission => (
                                <label key={permission._id} className="flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-2 rounded-lg transition-colors group">
                                  <div className="relative flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={newRole.permissions.includes(permission._id)}
                                      onChange={() => togglePermission(permission._id)}
                                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 checked:bg-blue-600 checked:border-blue-600 transition-all focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{permission.name}</span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{permission.description}</p>
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

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={loading || !newRole.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-bold shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </div>
                  ) : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Role Details</h2>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedRole.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedRole.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">{selectedRole.isDefault ? 'System Role' : 'Custom Role'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Users</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">{selectedRole.userCount} users</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Permissions</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">{selectedRole.permissions.length} permissions</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Created</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">{new Date(selectedRole.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-4">Assigned Permissions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRole.permissions.map(permissionId => {
                      const permission = permissions.find(p => p._id === permissionId);
                      if (!permission) return null;

                      const { icon: Icon } = getPermissionCategory(permission.category);

                      return (
                        <div key={permissionId} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Icon className={`w-3.5 h-3.5 text-blue-500`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{permission.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{permission.description}</p>
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
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Role</h2>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role Name *</label>
                    <input
                      type="text"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
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
                                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
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

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setEditingRole(null)}
                  className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-bold shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </div>
                  ) : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickCreate && (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl my-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quick Create Role</h2>
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="group border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => applyRoleTemplate(template)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform`}>
                        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{template.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {template.permissions.length} permissions included
                      </span>
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="px-8 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold"
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