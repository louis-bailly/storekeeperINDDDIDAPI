const express = require('express');
const router = express.Router();
const getWareHousesController = require('../../controllers/WareHouse/WareHouseController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/getWareHouses', authMiddleware, getWareHousesController.getWareHouses);

module.exports = router;
