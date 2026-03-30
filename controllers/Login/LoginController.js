const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getPool } = require('../../db/connection');
const tokenStore = require('./tokenStore');

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-a-changer';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);
const ACCESS_TOKEN_EXPIRES_SECONDS = 15 * 60; // 900s

const DB_QUERY = `
    SELECT
        EMPNO as BADGE_NUMBER,
        CAST(CAST(ENAME AS CHAR(30) CCSID 37) AS VARCHAR(30) CCSID 1208) as NAME
    FROM AMFLIB3.EMPMAS
    WHERE EMPNO = ?
    FETCH FIRST 1 ROWS ONLY
`;

async function fetchUser(badgeNumber) {
    const pool = getPool();
    if (!pool) throw new Error('DB_UNAVAILABLE');
    const result = await pool.query(DB_QUERY, [badgeNumber.toUpperCase()]);
    return result && result.length > 0 ? result[0] : null;
}

function generateTokenPair(badgeNumber) {
    const accessToken = jwt.sign({ badgeNumber }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = crypto.randomBytes(32).toString('hex');
    tokenStore.storeToken(refreshToken, badgeNumber, REFRESH_TOKEN_TTL_DAYS);
    return { accessToken, refreshToken };
}

function oauthResponse(res, accessToken, refreshToken, user) {
    return res.status(200).json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: ACCESS_TOKEN_EXPIRES_SECONDS,
        refresh_token: refreshToken,
        user: user || undefined,
    });
}

/**
 * POST /oauth/token
 * grant_type=password        → authentification badge
 * grant_type=refresh_token   → rotation du refresh token
 */
async function token(req, res) {
    try {
        const { grant_type } = req.body;

        // --- Password grant (login badge) ---
        if (grant_type === 'password') {
            const { badge_number } = req.body;

            if (!badge_number || badge_number.trim() === '') {
                return res.status(400).json({ error: 'invalid_request', error_description: 'badge_number requis' });
            }

            let userData;
            try {
                userData = await fetchUser(badge_number);
            } catch {
                return res.status(500).json({ error: 'server_error', error_description: 'Erreur de connexion à la base de données' });
            }

            if (!userData) {
                return res.status(401).json({ error: 'invalid_grant', error_description: 'Badge non reconnu' });
            }

            const user = { badgeNumber: userData.BADGE_NUMBER, name: userData.NAME };
            const { accessToken, refreshToken } = generateTokenPair(user.badgeNumber);
            return oauthResponse(res, accessToken, refreshToken, user);
        }

        // --- Refresh token grant ---
        if (grant_type === 'refresh_token') {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token requis' });
            }

            const badgeNumber = tokenStore.validateToken(refresh_token);
            if (!badgeNumber) {
                return res.status(401).json({ error: 'invalid_grant', error_description: 'Refresh token invalide ou expiré' });
            }

            // Rotation : invalider l'ancien, émettre un nouveau couple
            tokenStore.revokeToken(refresh_token);
            const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(badgeNumber);
            return oauthResponse(res, accessToken, newRefreshToken, null);
        }

        return res.status(400).json({ error: 'unsupported_grant_type', error_description: `grant_type '${grant_type}' non supporté` });

    } catch (error) {
        console.error('Erreur /oauth/token:', error);
        return res.status(500).json({
            error: 'server_error',
            error_description: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur',
        });
    }
}

/**
 * POST /oauth/revoke
 * Révoque un refresh token (logout)
 */
function revoke(req, res) {
    const { token: refreshToken } = req.body;
    if (refreshToken) {
        tokenStore.revokeToken(refreshToken);
    }
    return res.status(200).json({});
}

/**
 * GET /api/v1/auth/verify
 * Conservé pour compatibilité — vérifie un access token
 */
async function verify(req, res) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Token manquant' });
        }

        const accessToken = authHeader.substring(7);
        const decoded = jwt.verify(accessToken, JWT_SECRET);

        let userData;
        try {
            userData = await fetchUser(decoded.badgeNumber);
        } catch {
            return res.status(500).json({ success: false, message: 'Erreur de connexion à la base de données' });
        }

        if (!userData) {
            return res.status(401).json({ success: false, message: 'Utilisateur non trouvé ou inactif' });
        }

        return res.status(200).json({
            success: true,
            user: { badgeNumber: userData.BADGE_NUMBER, name: userData.NAME },
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token invalide' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expiré' });
        }
        console.error('Erreur /auth/verify:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
}

module.exports = { token, revoke, verify };
