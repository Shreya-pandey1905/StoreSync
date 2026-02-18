const express = require('express');
const router = express.Router();
const {
  getAllPurchases,
  getPurchasesByStore,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase
} = require('../controllers/purchaseController');

// GET /api/purchases - Get all purchases
router.get('/', getAllPurchases);

// GET /api/purchases/store/:storeId - Get purchases by store
router.get('/store/:storeId', getPurchasesByStore);

// GET /api/purchases/:id - Get single purchase
router.get('/:id', getPurchaseById);

// POST /api/purchases - Create new purchase
router.post('/', createPurchase);

// PUT /api/purchases/:id - Update purchase
router.put('/:id', updatePurchase);

// DELETE /api/purchases/:id - Delete purchase
router.delete('/:id', deletePurchase);

module.exports = router;