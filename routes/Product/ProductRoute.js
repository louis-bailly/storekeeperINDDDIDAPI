const express = require('express');
const router = express.Router();
const getProductController = require('../../controllers/Product/ProductController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/getProductByRef',  authMiddleware, getProductController.getProductByRef);
router.get('/getStocksByRef',   authMiddleware, getProductController.getStocksByRef);
router.get('/getUnitesGestion',  getProductController.getUnitesGestion);

module.exports = router;
