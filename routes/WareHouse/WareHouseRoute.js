const express = require('express');
const router = express.Router();
const getWareHousesController = require('../../controllers/WareHouse/WareHouseController');

/**
 * @route POST /api/v1/auth/login
 * @desc Authentification par badge
 * @access Public
 */
router.get('/getWareHouses', getWareHousesController.getWareHouses);

/**
 * @route GET /api/v1/auth/verify
 * @desc Vérifier le token JWT
 * @access Public
*/

module.exports = router;
