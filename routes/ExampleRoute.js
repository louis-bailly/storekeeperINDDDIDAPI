const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @route GET /api/v1/example/protected
 * @desc Exemple de route protégée
 * @access Private (nécessite un token JWT)
 */
router.get('/protected', authMiddleware, (req, res) => {
    // req.user contient les infos de l'utilisateur (userId, badgeNumber, role)
    res.json({
        success: true,
        message: 'Vous avez accès à cette route protégée!',
        user: req.user
    });
});

/**
 * @route GET /api/v1/example/public
 * @desc Exemple de route publique
 * @access Public
 */
router.get('/public', (req, res) => {
    res.json({
        success: true,
        message: 'Cette route est publique, pas besoin de token'
    });
});

module.exports = router;

