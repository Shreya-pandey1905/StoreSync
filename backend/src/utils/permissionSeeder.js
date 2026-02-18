const Permission = require('../models/Permission');
const Role = require('../models/Role');

// Default permissions for the system
const defaultPermissions = [
  // User Management Permissions
  { name: 'View Users', description: 'View user list and details', category: 'users', resource: 'users', action: 'read', level: 1, isSystem: true },
  { name: 'Create Users', description: 'Create new user accounts', category: 'users', resource: 'users', action: 'create', level: 2, isSystem: true },
  { name: 'Update Users', description: 'Update user information', category: 'users', resource: 'users', action: 'update', level: 2, isSystem: true },
  { name: 'Delete Users', description: 'Delete user accounts', category: 'users', resource: 'users', action: 'delete', level: 3, isSystem: true },
  { name: 'Manage User Roles', description: 'Assign and modify user roles', category: 'users', resource: 'users', action: 'manage', level: 3, isSystem: true },
  { name: 'Toggle User Status', description: 'Activate/deactivate users', category: 'users', resource: 'users', action: 'update', level: 2, isSystem: true },

  // Role Management Permissions
  { name: 'View Roles', description: 'View roles and permissions', category: 'users', resource: 'roles', action: 'read', level: 1, isSystem: true },
  { name: 'Create Roles', description: 'Create new roles', category: 'users', resource: 'roles', action: 'create', level: 3, isSystem: true },
  { name: 'Update Roles', description: 'Update role information and permissions', category: 'users', resource: 'roles', action: 'update', level: 3, isSystem: true },
  { name: 'Delete Roles', description: 'Delete custom roles', category: 'users', resource: 'roles', action: 'delete', level: 3, isSystem: true },

  // Inventory Management Permissions
  { name: 'View Products', description: 'View product list and details', category: 'inventory', resource: 'products', action: 'read', level: 1, isSystem: true },
  { name: 'Create Products', description: 'Add new products to inventory', category: 'inventory', resource: 'products', action: 'create', level: 2, isSystem: true },
  { name: 'Update Products', description: 'Update product information', category: 'inventory', resource: 'products', action: 'update', level: 2, isSystem: true },
  { name: 'Delete Products', description: 'Remove products from inventory', category: 'inventory', resource: 'products', action: 'delete', level: 3, isSystem: true },
  { name: 'Manage Stock', description: 'Update product stock levels', category: 'inventory', resource: 'products', action: 'update', level: 2, isSystem: true },
  { name: 'Export Inventory', description: 'Export inventory data', category: 'inventory', resource: 'products', action: 'export', level: 2, isSystem: true },

  // Sales Management Permissions
  { name: 'View Sales', description: 'View sales transactions', category: 'sales', resource: 'sales', action: 'read', level: 1, isSystem: true },
  { name: 'Create Sales', description: 'Process new sales transactions', category: 'sales', resource: 'sales', action: 'create', level: 1, isSystem: true },
  { name: 'Update Sales', description: 'Modify sales transactions', category: 'sales', resource: 'sales', action: 'update', level: 2, isSystem: true },
  { name: 'Delete Sales', description: 'Cancel sales transactions', category: 'sales', resource: 'sales', action: 'delete', level: 3, isSystem: true },
  { name: 'Process Refunds', description: 'Process refunds and returns', category: 'sales', resource: 'sales', action: 'update', level: 2, isSystem: true },
  { name: 'Export Sales', description: 'Export sales reports', category: 'sales', resource: 'sales', action: 'export', level: 2, isSystem: true },

  // Store Management Permissions
  { name: 'View Stores', description: 'View store information', category: 'stores', resource: 'stores', action: 'read', level: 1, isSystem: true },
  { name: 'Create Stores', description: 'Add new stores', category: 'stores', resource: 'stores', action: 'create', level: 3, isSystem: true },
  { name: 'Update Stores', description: 'Update store information', category: 'stores', resource: 'stores', action: 'update', level: 3, isSystem: true },
  { name: 'Delete Stores', description: 'Remove stores', category: 'stores', resource: 'stores', action: 'delete', level: 3, isSystem: true },

  // Analytics & Reports Permissions
  { name: 'View Analytics', description: 'View dashboard and analytics', category: 'analytics', resource: 'analytics', action: 'read', level: 1, isSystem: true },
  { name: 'View Reports', description: 'Generate and view reports', category: 'reports', resource: 'reports', action: 'read', level: 2, isSystem: true },
  { name: 'Export Reports', description: 'Export reports to various formats', category: 'reports', resource: 'reports', action: 'export', level: 2, isSystem: true },
  { name: 'Advanced Analytics', description: 'Access advanced analytics features', category: 'analytics', resource: 'analytics', action: 'manage', level: 3, isSystem: true },

  // Settings Permissions
  { name: 'View Settings', description: 'View system settings', category: 'settings', resource: 'settings', action: 'read', level: 2, isSystem: true },
  { name: 'Update Settings', description: 'Modify system settings', category: 'settings', resource: 'settings', action: 'update', level: 3, isSystem: true },
  { name: 'System Configuration', description: 'Configure system parameters', category: 'settings', resource: 'settings', action: 'manage', level: 3, isSystem: true },

  // System Permissions
  { name: 'View System Logs', description: 'View system activity logs', category: 'system', resource: 'logs', action: 'read', level: 3, isSystem: true },
  { name: 'Manage System', description: 'Perform system maintenance', category: 'system', resource: 'system', action: 'manage', level: 3, isSystem: true },
  { name: 'Backup System', description: 'Create system backups', category: 'system', resource: 'system', action: 'manage', level: 3, isSystem: true }
];

// Default roles with their permissions
const defaultRoles = [
  {
    name: 'admin',
    description: 'Full system access with all permissions',
    isDefault: true,
    level: 10,
    color: '#DC2626',
    permissions: [] // Will be populated with all permissions
  },
  {
    name: 'manager',
    description: 'Management level access with most permissions',
    isDefault: true,
    level: 5,
    color: '#2563EB',
    permissions: [] // Will be populated with manager-level permissions
  },
  {
    name: 'staff',
    description: 'Basic staff access for daily operations',
    isDefault: true,
    level: 1,
    color: '#059669',
    permissions: [] // Will be populated with staff-level permissions
  }
];

// Function to seed permissions
const seedPermissions = async () => {
  try {
    console.log('🌱 Seeding permissions...');
    
    // Clear existing permissions
    await Permission.deleteMany({});
    
    // Insert default permissions
    const createdPermissions = await Permission.insertMany(defaultPermissions);
    console.log(`✅ Created ${createdPermissions.length} permissions`);
    
    return createdPermissions;
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
};

// Function to seed roles
const seedRoles = async (permissions) => {
  try {
    console.log('🌱 Seeding roles...');
    
    // Clear existing roles
    await Role.deleteMany({});
    
    // Get all permissions for admin role
    const allPermissionIds = permissions.map(p => p._id);
    
    // Manager permissions: allow products read/create/update, sales read/create/update, users read, roles read, stores read, analytics read, reports read/export.
    const managerPermissionIds = permissions
      .filter(p => (
        // Inventory
        (p.resource === 'products' && ['read','create','update','export'].includes(p.action)) ||
        // Sales
        (p.resource === 'sales' && ['read','create','update','export'].includes(p.action)) ||
        // Users & Roles
        (p.resource === 'users' && ['read','update'].includes(p.action)) ||
        (p.resource === 'roles' && ['read'].includes(p.action)) ||
        // Stores
        (p.resource === 'stores' && ['read','update'].includes(p.action)) ||
        // Analytics & Reports
        (p.resource === 'analytics' && ['read'].includes(p.action)) ||
        (p.resource === 'reports' && ['read','export'].includes(p.action)) ||
        // Settings (read only)
        (p.resource === 'settings' && ['read'].includes(p.action))
      ))
      .map(p => p._id);

    // Staff permissions: allow products read, sales read/create, stores read, analytics read.
    const staffPermissionIds = permissions
      .filter(p => (
        // Inventory
        (p.resource === 'products' && ['read'].includes(p.action)) ||
        // Sales
        (p.resource === 'sales' && ['read','create'].includes(p.action)) ||
        // Stores
        (p.resource === 'stores' && ['read'].includes(p.action)) ||
        // Analytics
        (p.resource === 'analytics' && ['read'].includes(p.action))
      ))
      .map(p => p._id);
    
    // Update role permissions
    const rolesToCreate = [
      {
        ...defaultRoles[0],
        permissions: allPermissionIds
      },
      {
        ...defaultRoles[1],
        permissions: managerPermissionIds
      },
      {
        ...defaultRoles[2],
        permissions: staffPermissionIds
      }
    ];
    
    // Create roles
    const createdRoles = await Role.insertMany(rolesToCreate);
    console.log(`✅ Created ${createdRoles.length} roles`);
    
    return createdRoles;
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Seed permissions first
    const permissions = await seedPermissions();
    
    // Seed roles with permissions
    const roles = await seedRoles(permissions);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created ${permissions.length} permissions and ${roles.length} roles`);
    
    return { permissions, roles };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Function to check if database is already seeded
const isDatabaseSeeded = async () => {
  try {
    const permissionCount = await Permission.countDocuments();
    const roleCount = await Role.countDocuments();
    
    return permissionCount > 0 && roleCount > 0;
  } catch (error) {
    console.error('Error checking database seed status:', error);
    return false;
  }
};

module.exports = {
  seedDatabase,
  seedPermissions,
  seedRoles,
  isDatabaseSeeded,
  defaultPermissions,
  defaultRoles
};
