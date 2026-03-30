const odbc = require('odbc');
require('dotenv').config();

// Pool de connexions (recommande)
let pool;

async function initDB() {
    if (!process.env.DB_HOST) {
        console.warn('DB_HOST absent — connexion DB2 ignorée (mode CI/test)');
        return;
    }
    try {
        const connectionString = `DRIVER={IBM i Access ODBC Driver};SYSTEM=${process.env.DB_HOST};CCSID=1208;UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;
        pool = await odbc.pool(connectionString);
        console.log('Connecte a DB2 IBM i');
    } catch (error) {
        console.error('Erreur de connexion DB2:', error);
    }
}

function getPool() {
    return pool;
}

module.exports = { initDB, getPool };

