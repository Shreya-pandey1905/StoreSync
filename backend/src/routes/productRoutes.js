const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  getAllProducts,
  getProductsByStore,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// All routes require authentication
router.use(auth);

// GET /api/products - Get all products (staff+)
router.get('/', checkPermission('staff'), getAllProducts);

// GET /api/products/store/:storeId - Get products by store (staff+)
router.get('/store/:storeId', checkPermission('staff'), getProductsByStore);

// GET /api/products/:id - Get single product (staff+)
router.get('/:id', checkPermission('staff'), getProductById);

// POST /api/products - Create new product (manager+)
router.post('/', checkPermission('manager'), createProduct);

// PUT /api/products/:id - Update product (manager+)
router.put('/:id', checkPermission('manager'), updateProduct);

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', checkPermission('admin'), deleteProduct);

module.exports = router;
