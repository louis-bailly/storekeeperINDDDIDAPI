const express = require('express');
const router = express.Router();
const getProductController = require('../../controllers/Product/ProductController');

/**
 * @route POST /api/v1/
 * @desc Authentification par badge
 * @access Public
 */
router.get('/getProductByRef', getProductController.getProductByRef);

/**
 * @route GET /api/v1/auth/verify
 * @desc Vérifier le token JWT
 * @access Public
*/


module.exports = router;
