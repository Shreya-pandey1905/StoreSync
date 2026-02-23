# User Management System

A comprehensive user management system designed for medium-sized grocery stores with multiple branches. This system provides role-based access control, user activity logging, and advanced user management features.

## Features

### 🔐 Authentication & Authorization
- **Role-based permissions**: Admin, Manager, Staff
- **Secure password hashing** with bcrypt
- **Email verification** for new accounts
- **Password reset** functionality
- **JWT-based authentication**

### 👥 User Management
- **Create, read, update, delete** users
- **Bulk operations** for multiple users
- **User status management** (active/inactive)
- **Store assignment** for multi-branch support
- **Advanced search and filtering**
- **Pagination** for large user lists

### 📊 Analytics & Reporting
- **User statistics** dashboard
- **Activity logging** and audit trail
- **Real-time user metrics**
- **Role-based analytics**

### 🏪 Multi-Store Support
- **Store assignment** for users
- **Store-specific permissions**
- **Cross-store user management**

## API Endpoints

### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - User login
POST /api/auth/logout       - User logout
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password  - Reset password
```

### User Management
```
GET    /api/users           - Get all users (with pagination/filtering)
GET    /api/users/stats     - Get user statistics
GET    /api/users/search    - Search users
GET    /api/users/:id       - Get user by ID
POST   /api/users           - Create new user
PUT    /api/users/:id       - Update user
PATCH  /api/users/:id/toggle-status - Toggle user status
PATCH  /api/users/bulk-update - Bulk update users
DELETE /api/users/:id       - Delete user
```

### Activity Logging
```
GET /api/activities/user/:userId - Get user activities
GET /api/activities/user        - Get current user activities
GET /api/activities/system      - Get system activities (admin)
GET /api/activities/stats       - Get activity statistics
GET /api/activities/recent      - Get recent activities
```

## User Roles & Permissions

### Staff
- View user list
- View own profile
- Search users
- View recent activities

### Manager
- All Staff permissions
- Create users
- Update users
- Toggle user status
- Bulk operations
- View user statistics
- View activity logs

### Admin
- All Manager permissions
- Delete users
- View system activities
- Full system access

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String (optional),
  role: String (enum: ['admin', 'manager', 'staff']),
  store: ObjectId (ref: 'Store'),
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  lastLogin: Date,
  verificationToken: String,
  resetPasswordToken: String,
  profilePicture: String,
  permissions: [String],
  createdBy: ObjectId (ref: 'User')
}
```

### UserActivity Model
```javascript
{
  user: ObjectId (ref: 'User'),
  action: String (enum: actions),
  description: String,
  targetUser: ObjectId (ref: 'User'),
  targetStore: ObjectId (ref: 'Store'),
  details: Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

## Frontend Features

### User Interface
- **Modern, responsive design** with Tailwind CSS
- **Real-time updates** and notifications
- **Advanced filtering** and search
- **Bulk selection** and operations
- **Modal-based forms** for user management
- **Role-based UI** showing appropriate actions

### Key Components
- **UserTable**: Main user listing with pagination
- **UserForm**: Create/edit user modal
- **BulkOperations**: Bulk action modal
- **UserDetails**: User information modal
- **StatsCards**: User statistics display
- **ActivityLog**: User activity tracking

## Security Features

### Password Security
- **bcrypt hashing** with salt rounds of 12
- **Minimum password length** of 6 characters
- **Password validation** on both frontend and backend

### Access Control
- **JWT token authentication**
- **Role-based route protection**
- **Store-specific access control**
- **Admin protection** (cannot delete last admin)

### Data Protection
- **Input validation** and sanitization
- **SQL injection prevention**
- **XSS protection**
- **CSRF protection**

## Installation & Setup

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/grocery-store

# JWT
JWT_SECRET=your-secret-key

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000

# Server
PORT=5000
```

## Testing

Run the comprehensive test suite:
```bash
cd backend
node test-user-system.js
```

The test suite covers:
- User creation and validation
- User retrieval and search
- User updates and status changes
- Bulk operations
- Permission testing
- Activity logging
- User deletion

## Usage Examples

### Creating a User
```javascript
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword',
  role: 'staff',
  store: 'storeId123',
  phone: '+1234567890',
  isActive: true
};

const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(userData)
});
```

### Bulk User Operations
```javascript
const bulkData = {
  userIds: ['userId1', 'userId2', 'userId3'],
  updates: { isActive: false }
};

const response = await fetch('/api/users/bulk-update', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(bulkData)
});
```

### Getting User Activities
```javascript
const response = await fetch('/api/activities/user?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Performance Optimizations

### Database
- **Indexed fields** for faster queries
- **Pagination** for large datasets
- **Selective field projection**
- **Aggregation pipelines** for statistics

### Frontend
- **Lazy loading** of user data
- **Debounced search** to reduce API calls
- **Optimistic updates** for better UX
- **Caching** of frequently accessed data

## Monitoring & Logging

### Activity Tracking
- **User actions** are automatically logged
- **IP address** and user agent tracking
- **Detailed activity descriptions**
- **Timestamp** and user information

### Error Handling
- **Comprehensive error messages**
- **Graceful error recovery**
- **Error logging** for debugging
- **User-friendly error displays**

## Future Enhancements

### Planned Features
- **User profile pictures** upload
- **Advanced reporting** and analytics
- **Email notifications** for user changes
- **User import/export** functionality
- **Advanced role customization**
- **Two-factor authentication**

### Scalability
- **Redis caching** for session management
- **Database sharding** for large datasets
- **CDN integration** for static assets
- **Microservices architecture** for large deployments

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
