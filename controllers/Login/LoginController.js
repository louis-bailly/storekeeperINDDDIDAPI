const jwt = require('jsonwebtoken');
const { getPool } = require('../../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-a-changer';
const JWT_EXPIRES_IN = '24h'; // Token valide 24h

/**
 * Authentification par badge
 * @param {Object} req - Request avec { badgeNumber } dans le body
 * @param {Object} res - Response
 */
async function login(req, res) {
    try {
        const { badgeNumber } = req.body;

        // Validation
        if (!badgeNumber || badgeNumber.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le numéro de badge est requis'
            });
        }

        // Récupérer le pool de connexion DB2
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }


        const query = `
            SELECT 
                EMPNO as BADGE_NUMBER,
                ENAME as NAME
            FROM AMFLIB3.EMPMAS 
            WHERE EMPNO = ? 
            FETCH FIRST 1 ROWS ONLY
        `;

        const result = await pool.query(query, [badgeNumber.toUpperCase()]);

        // Vérifier si l'utilisateur existe
        if (!result || result.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Badge non reconnu'
            });
        }

        const userData = result[0];

        // Créer l'objet utilisateur
        const user = {
            badgeNumber: userData.BADGE_NUMBER,
            name: userData.NAME,
        };

        // Générer le token JWT
        const token = jwt.sign(
            {
                badgeNumber: user.badgeNumber,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Retourner la réponse
        return res.status(200).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'authentification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Vérifier le token JWT (pour les routes protégées)
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
async function verify(req, res) {
    try {
        // Le token devrait être dans l'en-tête Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token manquant'
            });
        }

        const token = authHeader.substring(7); // Enlever "Bearer "

        // Vérifier le token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Optionnel: Vérifier que l'utilisateur existe toujours dans la DB
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        const query = `
            SELECT
                EMPNO as BADGE_NUMBER,
                ENAME as NAME
            FROM AMFLIB3.EMPMAS
            WHERE EMPNO = ?
            FETCH FIRST 1 ROWS ONLY
        `;

        const result = await pool.query(query, [decoded.badgeNumber]);

        if (!result || result.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé ou inactif'
            });
        }

        const userData = result[0];

        return res.status(200).json({
            success: true,
            user: {
                badgeNumber: userData.BADGE_NUMBER,
                name: userData.NAME,
            }
        });

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

        console.error('Erreur lors de la vérification:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification'
        });
    }
}

module.exports = {
    login,
    verify
};
