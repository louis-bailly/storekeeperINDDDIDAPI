'use strict';

const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

const SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-super-securise-a-changer';

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('authMiddleware', () => {
    test('appelle next() avec un token valide', () => {
        const token = jwt.sign({ userId: '1', badgeNumber: 'B001', role: 'user' }, SECRET, { expiresIn: '15m' });
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = makeRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toMatchObject({ badgeNumber: 'B001' });
    });

    test('retourne 401 si Authorization est absent', () => {
        const req = { headers: {} };
        const res = makeRes();
        authMiddleware(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test('retourne 401 si le header ne commence pas par Bearer', () => {
        const req = { headers: { authorization: 'Basic abc' } };
        const res = makeRes();
        authMiddleware(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('retourne 401 pour un token invalide (mauvaise signature)', () => {
        const badToken = jwt.sign({ badgeNumber: 'B001' }, 'mauvais-secret');
        const req = { headers: { authorization: `Bearer ${badToken}` } };
        const res = makeRes();
        authMiddleware(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token invalide' }));
    });

    test('retourne 401 pour un token expiré', () => {
        const expiredToken = jwt.sign({ badgeNumber: 'B001' }, SECRET, { expiresIn: -1 });
        const req = { headers: { authorization: `Bearer ${expiredToken}` } };
        const res = makeRes();
        authMiddleware(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token expiré' }));
    });
});
