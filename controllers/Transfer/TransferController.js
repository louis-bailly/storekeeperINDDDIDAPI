const { getPool }                                        = require('../../db/connection');
const { callLSTGETITM, generateToken, getTransactionNumber } = require('../../services/As400Service');

// ---------------------------------------------------------------------------
// Helpers date / heure (format IBM i)
// ---------------------------------------------------------------------------

/**
 * Retourne la date courante au format CYYMMDD (ex. "1260325" pour le 25/03/2026).
 * C = siècle (0 = 19xx, 1 = 20xx).
 */
function getIBMDate() {
    const now = new Date();
    const yy  = String(now.getFullYear()).slice(2);
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const dd  = String(now.getDate()).padStart(2, '0');
    return `1${yy}${mm}${dd}`;
}

/**
 * Retourne l'heure courante au format HHMMSS (ex. "143052").
 */
function getIBMTime() {
    const now = new Date();
    return [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => String(n).padStart(2, '0'))
        .join('');
}

// ---------------------------------------------------------------------------
// POST /api/v1/stock/transfer
// ---------------------------------------------------------------------------

/**
 * Déclenche un transfert de stock TW via un INSERT dans AMTLIB3.TRDATA.
 * Le numéro de transaction (TRNNO) est obtenu dynamiquement via CLPZNXTRN.PGM.
 *
 * Body attendu :
 *   itnbr  {string}  Numéro article            (ex. 'ART001')
 *   llocn  {string}  Emplacement source         (ex. 'A01-01')
 *   ust305 {string}  Emplacement cible          (ex. 'B02-03')
 *   lqnty  {number}  Quantité UG à transférer   (ex. 12.5)
 *   house  {string}  Code magasin               (ex. '06')
 *   um     {string}  Unité de mesure            (ex. 'KG')
 *
 * Le badge est récupéré depuis le JWT (req.user.badgeNumber) — jamais du body.
 */
async function transferStock(req, res) {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        const { itnbr, llocn, ust305, lqnty, house, um } = req.body;
        const badge = parseInt(req.user.badgeNumber, 10); // BADGE DECIMAL(5,0)

        // --- Validation de présence ---
        if (!itnbr || !llocn || !ust305 || lqnty === undefined || lqnty === null || !house || !um) {
            return res.status(400).json({
                success: false,
                message: 'Paramètres requis : itnbr, llocn, ust305, lqnty, house, um'
            });
        }

        // --- Validation de types ---
        const qty = parseFloat(lqnty);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La quantité doit être un nombre strictement positif'
            });
        }

        // --- 1. Récupération du numéro de transaction via CLPZNXTRN.PGM ---
        const trnno = parseInt(await getTransactionNumber(), 10); // DECIMAL(7,0)
        const fdate = parseInt(getIBMDate(), 10);                 // DECIMAL(7,0) CYYMMDD
        const ttime = parseInt(getIBMTime(), 10);                 // DECIMAL(6,0) HHMMSS

        console.log(`[TW] TRNNO:${trnno} | article:${itnbr} | de:${llocn} → ${ust305} | qty:${qty} ${um} | badge:${badge}`);

        // --- 2. INSERT dans AMTLIB3.TRDATA ---
        // Le driver ODBC IBM i (CCSID=1208 UTF-8 ↔ AS400 EBCDIC 297) ne supporte pas
        // le binding paramétré (?) pour les colonnes DECIMAL/NUMERIC — erreur 22018 systématique.
        // Solution : SQL direct avec valeurs embarquées.
        // Sécurité : les strings venant du body sont échappées via esc() (apostrophes doublées).
        const esc = (val, maxLen) =>
            String(val ?? '').replace(/'/g, "''").substring(0, maxLen);

        const sql = `
            INSERT INTO AMTLIB3.TRDATA
                (ACREC, ACRECP, APCOD, BADGE, CRWYN, CTLID,
                 FDATE, HDEPT, ITNBR, LBHNO, IPLOC, LLOCN,
                 TWHSE, TLOCN, LSTTR, QUEUE, RSUPF, SHFTC,
                 TDATE, TRFMT, TRNNO, TRQTY, ENTUM, TSTAT,
                 GRNI,  ENSTN, TTIME, WSID,  REFNO)
            VALUES
                ('Y', 'N', 'I', ${badge}, 'N', ' ',
                 ${fdate}, ' ', '${esc(itnbr, 15)}', ' ', '${esc(house, 3)}', '${esc(llocn, 7)}',
                 '${esc(house, 3)}', '${esc(ust305, 7)}', '0', 1, 2, 1,
                 ${fdate}, 'TW', ${trnno}, ${qty}, '${esc(um, 2)}', 3,
                 '0', 'A', ${ttime}, 'STKAPP', ' ')
        `;

        await pool.query(sql);

        return res.status(200).json({
            success: true,
            message: `Transfert TW effectué : ${itnbr} de ${llocn} vers ${ust305} (${qty} ${um}) — TRNNO: ${trnno}`
        });

    } catch (err) {
        console.error('[TW] Erreur transferStock:', err);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors du transfert de stock',
            error: err.message
        });
    }
}

// ---------------------------------------------------------------------------
// POST /api/v1/stock/pull-list-request
// ---------------------------------------------------------------------------

/**
 * Planifie une demande de Pull List sur l'AS400 via le programme LSTGETITM.
 * Équivalent Node.js du call_LSTGETITM_PGM() Java (JTOpen).
 *
 * Aucun body requis : le badge vient du JWT, program/user depuis l'env.
 *
 * Réponse :
 *   { success: true, message: string }  – message récupéré dans AMFLIB3.TSKMSG
 */
async function pullListRequest(req, res) {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        // Paramètres de l'appel AS400
        const badge   = req.user.badgeNumber;           // JWT — badge de l'employé connecté
        const program = process.env.PLR_PROGRAM ?? '';  // Nom programme (ex. 'MYPGM  ')
        const user    = process.env.PLR_USER    ?? '';  // Utilisateur AS400
        const token   = generateToken();                 // Token de corrélation (10 chars)

        console.log(`[LSTGETITM] Schedule .... ${program}`);
        console.log(`[LSTGETITM] User ....... ${user}`);
        console.log(`[LSTGETITM] Badge ...... ${badge}`);
        console.log(`[LSTGETITM] Token ...... ${token}`);

        // Appel du programme RPG (itoolkit)
        await callLSTGETITM({ program, user, badge, token });

        // Lecture du message résultat dans AMFLIB3.TSKMSG
        // Équivalent du getPLRequestMsg(token) Java
        const rows    = await pool.query(
            'SELECT TSKMS FROM AMFLIB3.TSKMSG WHERE TSKID = ?',
            [token]
        );
        const message = rows?.[0]?.TSKMS?.trim() ?? 'Planifié';

        console.log(`[LSTGETITM] Message .... ${message}`);

        return res.status(200).json({ success: true, message });

    } catch (err) {
        console.error('[LSTGETITM] Erreur pullListRequest:', err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { transferStock, pullListRequest };
