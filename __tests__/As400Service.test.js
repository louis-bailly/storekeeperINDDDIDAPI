'use strict';

// itoolkit nécessite une connexion IBM i réelle — on le mocke entièrement
jest.mock('itoolkit');

const { generateToken } = require('../services/As400Service');

describe('As400Service — generateToken', () => {
    test('retourne une chaîne de 10 caractères', () => {
        const t = generateToken();
        expect(typeof t).toBe('string');
        expect(t).toHaveLength(10);
    });

    test('ne contient que des lettres majuscules et des chiffres', () => {
        const t = generateToken();
        expect(t).toMatch(/^[A-Z0-9]{10}$/);
    });

    test('génère des tokens différents à chaque appel (entropie)', () => {
        const tokens = new Set(Array.from({ length: 50 }, generateToken));
        // Sur 50 appels, statistiquement au moins 45 doivent être uniques
        expect(tokens.size).toBeGreaterThan(45);
    });
});
