'use strict';

const { storeToken, validateToken, revokeToken } = require('../controllers/Login/tokenStore');

describe('tokenStore', () => {
    describe('storeToken / validateToken', () => {
        test('retourne le badgeNumber pour un token valide', () => {
            storeToken('tok-valid', 'B001', 1);
            expect(validateToken('tok-valid')).toBe('B001');
        });

        test('retourne null pour un token inconnu', () => {
            expect(validateToken('tok-inconnu-xyz')).toBeNull();
        });

        test('retourne null pour un token expiré', () => {
            // TTL négatif → expiresAt dans le passé
            storeToken('tok-expired', 'B002', -1);
            expect(validateToken('tok-expired')).toBeNull();
        });

        test('deux tokens distincts coexistent indépendamment', () => {
            storeToken('tok-a', 'A001', 1);
            storeToken('tok-b', 'A002', 1);
            expect(validateToken('tok-a')).toBe('A001');
            expect(validateToken('tok-b')).toBe('A002');
        });
    });

    describe('revokeToken', () => {
        test('invalide le token après révocation', () => {
            storeToken('tok-revoke', 'B003', 1);
            revokeToken('tok-revoke');
            expect(validateToken('tok-revoke')).toBeNull();
        });

        test('révoquer un token inexistant ne lève pas d\'erreur', () => {
            expect(() => revokeToken('tok-inexistant')).not.toThrow();
        });
    });

    describe('sécurité — hachage SHA256', () => {
        test('le token brut ne doit pas être stocké en clair (validateToken ne fonctionne pas avec le hash)', () => {
            const crypto = require('crypto');
            const raw = 'tok-hash-check';
            storeToken(raw, 'B004', 1);
            // Le hash du token ne doit pas lui-même valider
            const hash = crypto.createHash('sha256').update(raw).digest('hex');
            expect(validateToken(hash)).toBeNull();
        });
    });
});
