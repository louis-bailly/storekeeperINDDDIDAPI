const express = require('express');
const router = express.Router();
const LoginController = require('../../controllers/Login/LoginController');

/**
 * @route POST /api/v1/auth/login
 * @desc Authentification par badge
 * @access Public
 */
router.post('/login', LoginController.login);

/**
 * @route GET /api/v1/auth/verify
 * @desc Vérifier le token JWT
 * @access Public
 */
router.get('/verify', LoginController.verify);

module.exports = router;

