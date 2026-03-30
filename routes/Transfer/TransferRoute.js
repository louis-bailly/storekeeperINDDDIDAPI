const express = require('express');
const router = express.Router();
const TransferController = require('../../controllers/Transfer/TransferController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/transfer',           authMiddleware, TransferController.transferStock);
router.post('/pull-list-request', authMiddleware, TransferController.pullListRequest);

module.exports = router;
