const { Connection, CommandCall, ProgramCall, xmlToJson } = require('itoolkit');

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

// Programmes AS400 : nom court + lib séparés (ODBC/PASE ne supporte pas le chemin IFS /QSYS.LIB/...)
const LSTGETITM_PGM       = 'LSTGETITM';
const LSTGETITM_LIB       = 'INTE3OBJ';
const LSTGETITM_LIBRARIES = ['INTE3FIC', 'AMFLIB3', 'INTE3OBJ', 'AMALIBE'];

const CLPZNXTRN_PGM       = 'CLPZNXTRN';
const CLPZNXTRN_LIB       = 'INTE3OBJ';
const CLPZNXTRN_LIBRARIES = ['AMFLIB3', 'AMTLIB3', 'SMFLIB3', 'INTE3OBJ', 'INTE3FIC'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Génère un token alphanumérique de 10 caractères.
 * Utilisé comme identifiant de corrélation de la requête AS400
 * (équivalent de generateToken() en Java).
 *
 * @returns {string}
 */
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 10 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');
}

/**
 * Instancie une connexion itoolkit via le transport ODBC (IBM i Access ODBC Driver).
 * Credentials issus exclusivement des variables d'environnement.
 *
 * @returns {Connection}
 */
function createConnection() {
    return new Connection({
        transport: 'odbc',
        transportOptions: {
            host:     process.env.DB_HOST,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        },
    });
}

// ---------------------------------------------------------------------------
// Appel programme RPG — LSTGETITM
// ---------------------------------------------------------------------------

/**
 * Appelle le programme /QSYS.LIB/INTE3OBJ.LIB/LSTGETITM.PGM sur l'AS400.
 * Équivalent Node.js du call_LSTGETITM_PGM() Java (JTOpen ProgramCall).
 *
 * Paramètres AS400 (positionnels) :
 *   [0] program  7A   INPUT  – Nom du programme à planifier
 *   [1] user    10A   INPUT  – Utilisateur AS400
 *   [2] badge    5A   INPUT  – Badge de l'employé
 *   [3] token   10A   INPUT  – Token de corrélation (clé TSKMSG)
 *
 * @param {object} params
 * @param {string} params.program  Nom programme (max 7 chars)
 * @param {string} params.user     Utilisateur AS400 (max 10 chars)
 * @param {string} params.badge    Badge employé (max 5 chars)
 * @param {string} params.token    Token de corrélation (max 10 chars)
 * @returns {Promise<void>}        Résout si le programme s'est exécuté avec succès
 */
function callLSTGETITM({ program, user, badge, token }) {
    return new Promise((resolve, reject) => {
        const conn = createConnection();

        // 1. Ajout des bibliothèques (équivalent Java : cc.run("ADDLIBLE ..."))
        LSTGETITM_LIBRARIES.forEach(lib =>
            conn.add(new CommandCall({ command: `ADDLIBLE LIB(${lib}) POSITION(*LAST)`, type: 'cl' }))
        );

        // 2. Construction de l'appel programme RPG
        //    padEnd + substring = équivalent du AS400Text(n).toBytes() Java
        //    lib séparée du nom → compatible ODBC/PASE (pas de chemin IFS /QSYS.LIB/...)
        const pgm = new ProgramCall(LSTGETITM_PGM, { lib: LSTGETITM_LIB });
        pgm.addParam({ type: '7A',  name: 'program', io: 'in', value: program.padEnd(7).substring(0, 7)   });
        pgm.addParam({ type: '10A', name: 'user',    io: 'in', value: user.padEnd(10).substring(0, 10)    });
        pgm.addParam({ type: '5A',  name: 'badge',   io: 'in', value: badge.padEnd(5).substring(0, 5)     });
        pgm.addParam({ type: '10A', name: 'token',   io: 'in', value: token.padEnd(10).substring(0, 10)   });
        conn.add(pgm);

        // 3. Exécution — Connection.run() retourne (error, xmlOut)
        conn.run((error, xmlOut) => {
            if (error) {
                reject(new Error(String(error)));
                return;
            }
            try {
                const results   = xmlToJson(xmlOut);
                const pgmResult = results.find(r => r.type === 'pgm');

                if (pgmResult && pgmResult.success === true) {
                    resolve();
                } else {
                    const errMsg = pgmResult?.data?.[0]?.value
                        ?? 'Échec de l\'appel programme AS400 (LSTGETITM)';
                    reject(new Error(errMsg));
                }
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
}

// ---------------------------------------------------------------------------
// Appel programme RPG — CLPZNXTRN (numéro de transaction)
// ---------------------------------------------------------------------------

/**
 * Appelle CLPZNXTRN.PGM pour obtenir le prochain numéro de transaction (TRNNO).
 * Équivalent Node.js du getTransactionNumber() Java (JTOpen ProgramCall).
 *
 * Paramètre AS400 (positionnel) :
 *   [0] trnno  7A  INPUT/OUTPUT – 7 espaces en entrée, TRNNO en sortie
 *
 * @returns {Promise<string>}  Numéro de transaction sans zéros de tête (ex. '12345')
 */
function getTransactionNumber() {
    return new Promise((resolve, reject) => {
        const conn = createConnection();

        // Ajout des bibliothèques (équivalent Java : cc.run("ADDLIBLE ..."))
        CLPZNXTRN_LIBRARIES.forEach(lib =>
            conn.add(new CommandCall({ command: `ADDLIBLE LIB(${lib}) POSITION(*LAST)`, type: 'cl' }))
        );

        // Paramètre unique : 7 espaces en INPUT, TRNNO en OUTPUT
        // lib séparée du nom → compatible ODBC/PASE (pas de chemin IFS /QSYS.LIB/...)
        const pgm = new ProgramCall(CLPZNXTRN_PGM, { lib: CLPZNXTRN_LIB });
        pgm.addParam({ type: '7A', name: 'trnno', io: 'both', value: '       ' });
        conn.add(pgm);

        // Exécution — Connection.run() retourne (error, xmlOut)
        conn.run((error, xmlOut) => {
            if (error) {
                reject(new Error(String(error)));
                return;
            }
            try {
                const results   = xmlToJson(xmlOut);
                const pgmResult = results.find(r => r.type === 'pgm');

                if (pgmResult && pgmResult.success === true) {
                    // Récupération de la valeur de sortie + suppression des zéros en tête
                    // Équivalent Java : Integer.parseInt(TRNNO) + ""
                    const raw   = pgmResult.data?.find(d => d.name === 'trnno')?.value ?? '0';
                    const trnno = String(parseInt(raw.trim(), 10));
                    resolve(trnno);
                } else {
                    reject(new Error('Échec de l\'appel programme AS400 (CLPZNXTRN)'));
                }
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { callLSTGETITM, generateToken, getTransactionNumber };
