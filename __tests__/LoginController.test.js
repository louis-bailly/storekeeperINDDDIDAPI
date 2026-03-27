'use strict';

// Mock odbc avant tout require (évite l'échec de compilation native en CI)
jest.mock('odbc');

// Mock de la couche DB : on contrôle ce que getPool retourne
jest.mock('../db/connection', () => ({
    getPool: jest.fn(),
    initDB: jest.fn().mockResolvedValue(undefined),
}));

const { getPool } = require('../db/connection');
const { token, revoke } = require('../controllers/Login/LoginController');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('LoginController — grant_type=password', () => {
    test('retourne 400 si badge_number est absent', async () => {
        const req = { body: { grant_type: 'password' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_request' }));
    });

    test('retourne 400 si badge_number est vide', async () => {
        const req = { body: { grant_type: 'password', badge_number: '   ' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('retourne 500 si le pool DB est indisponible', async () => {
        getPool.mockReturnValue(null);
        const req = { body: { grant_type: 'password', badge_number: 'B001' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'server_error' }));
    });

    test('retourne 401 si le badge est inconnu (aucune ligne DB)', async () => {
        getPool.mockReturnValue({ query: jest.fn().mockResolvedValue([]) });
        const req = { body: { grant_type: 'password', badge_number: 'INCONNU' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_grant' }));
    });

    test('retourne 200 avec access_token et refresh_token pour un badge valide', async () => {
        getPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([{ BADGE_NUMBER: 'B001', NAME: 'Jean Dupont' }]),
        });
        const req = { body: { grant_type: 'password', badge_number: 'B001' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        const body = res.json.mock.calls[0][0];
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('refresh_token');
        expect(body.token_type).toBe('Bearer');
        expect(body.user).toMatchObject({ badgeNumber: 'B001', name: 'Jean Dupont' });
    });
});

describe('LoginController — grant_type=refresh_token', () => {
    test('retourne 400 si refresh_token est absent', async () => {
        const req = { body: { grant_type: 'refresh_token' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('retourne 401 pour un refresh_token invalide', async () => {
        const req = { body: { grant_type: 'refresh_token', refresh_token: 'fake-token' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_grant' }));
    });

    test('émet un nouveau couple de tokens avec un refresh_token valide', async () => {
        // 1. Obtenir un vrai refresh_token via un login
        getPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([{ BADGE_NUMBER: 'B002', NAME: 'Marie Martin' }]),
        });
        const loginReq = { body: { grant_type: 'password', badge_number: 'B002' } };
        const loginRes = makeRes();
        await token(loginReq, loginRes);
        const { refresh_token: rt } = loginRes.json.mock.calls[0][0];

        // 2. Utiliser le refresh_token
        const refreshReq = { body: { grant_type: 'refresh_token', refresh_token: rt } };
        const refreshRes = makeRes();
        await token(refreshReq, refreshRes);

        expect(refreshRes.status).toHaveBeenCalledWith(200);
        const body = refreshRes.json.mock.calls[0][0];
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('refresh_token');
        // Nouveau refresh_token doit être différent de l'ancien (rotation)
        expect(body.refresh_token).not.toBe(rt);
    });

    test('l\'ancien refresh_token est révoqué après rotation', async () => {
        getPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([{ BADGE_NUMBER: 'B003', NAME: 'Pierre Durand' }]),
        });
        const loginReq = { body: { grant_type: 'password', badge_number: 'B003' } };
        const loginRes = makeRes();
        await token(loginReq, loginRes);
        const { refresh_token: rt } = loginRes.json.mock.calls[0][0];

        // Première rotation
        const refreshReq = { body: { grant_type: 'refresh_token', refresh_token: rt } };
        const refreshRes = makeRes();
        await token(refreshReq, refreshRes);

        // Réutiliser l'ancien refresh_token → doit échouer
        const replayReq = { body: { grant_type: 'refresh_token', refresh_token: rt } };
        const replayRes = makeRes();
        await token(replayReq, replayRes);
        expect(replayRes.status).toHaveBeenCalledWith(401);
    });
});

describe('LoginController — grant_type non supporté', () => {
    test('retourne 400 pour un grant_type inconnu', async () => {
        const req = { body: { grant_type: 'client_credentials' } };
        const res = makeRes();
        await token(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'unsupported_grant_type' }));
    });
});

describe('LoginController — revoke', () => {
    test('retourne 200 même si le token est inconnu', () => {
        const req = { body: { token: 'token-inexistant' } };
        const res = makeRes();
        revoke(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('retourne 200 si le body est vide', () => {
        const req = { body: {} };
        const res = makeRes();
        revoke(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
