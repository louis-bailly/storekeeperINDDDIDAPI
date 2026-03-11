const crypto = require('crypto');

/**
 * In-memory store pour les refresh tokens.
 * Map<hash(token), { badgeNumber: string, expiresAt: number }>
 */
const store = new Map();

// Nettoyage automatique des tokens expirés toutes les heures
setInterval(() => {
    const now = Date.now();
    for (const [hash, data] of store) {
        if (data.expiresAt < now) {
            store.delete(hash);
        }
    }
}, 60 * 60 * 1000).unref(); // .unref() évite de bloquer l'arrêt du process

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Stocker un refresh token
 * @param {string} token - Le refresh token brut
 * @param {string} badgeNumber
 * @param {number} ttlDays - Durée de vie en jours
 */
function storeToken(token, badgeNumber, ttlDays) {
    const hash = hashToken(token);
    const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
    store.set(hash, { badgeNumber, expiresAt });
}

/**
 * Valider un refresh token
 * @param {string} token - Le refresh token brut
 * @returns {string|null} badgeNumber si valide, null sinon
 */
function validateToken(token) {
    const hash = hashToken(token);
    const entry = store.get(hash);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
        store.delete(hash);
        return null;
    }
    return entry.badgeNumber;
}

/**
 * Révoquer un refresh token
 * @param {string} token - Le refresh token brut
 */
function revokeToken(token) {
    store.delete(hashToken(token));
}

module.exports = { storeToken, validateToken, revokeToken };
