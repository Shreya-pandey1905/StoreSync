const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "***hidden***" : "Not Set");
console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("All environment variables loaded successfully!");



const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db_config');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import existing routes
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const saleRoutes = require('./routes/saleRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

// ✅ Import new routes
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);

// ✅ Use new routes
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/activities', activityRoutes);

// Root
app.get('/', (req, res) => {
  res.send('SmartKirana API is running');
});

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
