const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// All routes require authentication
router.use(auth);

// Create a new sale (staff+)
router.post('/create', checkPermission('staff'), saleController.createSimpleSale);

// Get all sales with filters and pagination (staff+)
router.get('/', checkPermission('staff'), saleController.getAllSales);

// Get sales statistics (manager+)
router.get('/stats', checkPermission('manager'), saleController.getSalesStats);

// Export sales data (manager+)
router.get('/export', checkPermission('manager'), saleController.exportSales);

// Get sale by ID (staff+)
router.get('/:id', checkPermission('staff'), saleController.getSaleById);

// Update sale (manager+)
router.put('/:id', checkPermission('manager'), saleController.updateSale);

// Delete sale (admin only)
router.delete('/:id', checkPermission('admin'), saleController.deleteSale);

// Process refund (manager+)
router.post('/:id/refund', checkPermission('manager'), saleController.processRefund);

module.exports = router;
