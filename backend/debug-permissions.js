const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CollegeProject';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${mongoURI}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const debugPermissions = async () => {
  try {
    console.log('🔍 Debugging permissions...\n');
    
    // Check all users
    const users = await User.find({}).select('name email role isActive');
    console.log('👥 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    console.log('');
    
    // Check all roles
    const roles = await Role.find({}).populate('permissions', 'name resource action');
    console.log('🛡️ Roles in database:');
    roles.forEach(role => {
      console.log(`  - ${role.name} (Level: ${role.level}) - Permissions: ${role.permissions.length}`);
      if (role.permissions.length > 0) {
        console.log(`    Permissions: ${role.permissions.map(p => `${p.resource}:${p.action}`).join(', ')}`);
      }
    });
    console.log('');
    
    // Check all permissions
    const permissions = await Permission.find({});
    console.log('🔐 Permissions in database:');
    permissions.forEach(permission => {
      console.log(`  - ${permission.name} (${permission.resource}:${permission.action}) - Level: ${permission.level}`);
    });
    console.log('');
    
    // Check admin user specifically
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('👑 Admin user found:');
      console.log(`  - Name: ${adminUser.name}`);
      console.log(`  - Email: ${adminUser.email}`);
      console.log(`  - Role: ${adminUser.role}`);
      console.log(`  - Active: ${adminUser.isActive}`);
      
      // Get admin role with permissions
      const adminRole = await Role.findOne({ name: 'admin' }).populate('permissions');
      if (adminRole) {
        console.log(`  - Admin role has ${adminRole.permissions.length} permissions`);
        console.log(`  - Permissions: ${adminRole.permissions.map(p => `${p.resource}:${p.action}`).join(', ')}`);
      } else {
        console.log('  ❌ Admin role not found!');
      }
    } else {
      console.log('❌ No admin user found!');
    }
    
  } catch (error) {
    console.error('❌ Error debugging permissions:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the debug
connectDB().then(() => {
  debugPermissions();
});
