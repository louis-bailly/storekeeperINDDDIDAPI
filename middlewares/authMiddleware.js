const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-a-changer';
// JWT_EXPIRES_IN est géré dans LoginController, pas ici (le middleware ne génère pas de tokens)

/**
 * Middleware pour protéger les routes
 * Vérifie que le token JWT est présent et valide
 */
function authMiddleware(req, res, next) {
    try {
        // Récupérer le token depuis l'en-tête Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Accès non autorisé - Token manquant'
            });
        }

        const token = authHeader.substring(7); // Enlever "Bearer "

        // Vérifier le token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Ajouter les données de l'utilisateur dans req pour les routes suivantes
        req.user = {
            userId: decoded.userId,
            badgeNumber: decoded.badgeNumber,
            role: decoded.role
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }

        console.error('Erreur middleware auth:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification'
        });
    }
}

module.exports = authMiddleware;

