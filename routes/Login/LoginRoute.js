const express = require('express');
const router = express.Router();
const LoginController = require('../../controllers/Login/LoginController');

/**
 * @route POST /oauth/token
 * @desc Authentification (grant_type=password) ou refresh (grant_type=refresh_token)
 * @access Public
 */
router.post('/token', LoginController.token);

/**
 * @route POST /oauth/revoke
 * @desc Révoquer un refresh token (logout)
 * @access Public
 */
router.post('/revoke', LoginController.revoke);

/**
 * @route GET /api/v1/auth/verify
 * @desc Vérifier un access token (conservé pour compatibilité)
 * @access Public
 */
router.get('/verify', LoginController.verify);

module.exports = router;
