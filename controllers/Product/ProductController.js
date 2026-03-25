const jwt = require('jsonwebtoken');
const { getPool } = require('../../db/connection');
const EBCDIC_037 = {
    0x40: " ",
    0xc1: "A",0xc2:"B",0xc3:"C",0xc4:"D",0xc5:"E",0xc6:"F",0xc7:"G",0xc8:"H",0xc9:"I",
    0xd1:"J",0xd2:"K",0xd3:"L",0xd4:"M",0xd5:"N",0xd6:"O",0xd7:"P",0xd8:"Q",0xd9:"R",
    0xe2:"S",0xe3:"T",0xe4:"U",0xe5:"V",0xe6:"W",0xe7:"X",0xe8:"Y",0xe9:"Z",
    0xf0:"0",0xf1:"1",0xf2:"2",0xf3:"3",0xf4:"4",0xf5:"5",0xf6:"6",0xf7:"7",0xf8:"8",0xf9:"9",
    0x60:"-",0x6b:".",0x61:"/",0x7a:"#"
};

function decodeEBCDIC(buffer) {
    if (buffer == null) return '';
    const bytes = new Uint8Array(buffer);
    let out = "";

    for (const b of bytes) {
        out += EBCDIC_037[b] ?? "";
    }

    return out.trim();
}

async function getProductByRef(req, res) {
    try{
        // Récupérer le pool de connexion DB2
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }
        // Le driver ODBC IBM i ne supporte pas le binding ? sur colonnes CCSID 65535
        // → interpolation directe avec nettoyage strict (whitelist alphanumérique)
        const ref     = (req.query.ref     ?? '').trim().replace(/[^A-Z0-9a-z\-\.\/# ]/g, '');
        const atelier = (req.query.atelier ?? '').trim().replace(/[^A-Z0-9a-z\-\.\/# ]/g, '');

        console.log('ref:', ref, '| atelier:', atelier);

        if (!ref) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre ref est requis'
            });
        }

        const whereAtelier = atelier ? `AND s.LLOCN = '${atelier}'` : '';
        const query = `
            SELECT coc.ITNBR, rva.ITDSC, coc.UST305, rva.UNMSR, s.LQNTY, s.LLOCN, i.MULQ 
            FROM INTE3FIC.ITMCOC coc
            JOIN AMFLIB3.ITMRVA rva ON rva.ITNBR = coc.ITNBR
            JOIN AMFLIB3.SLQNTY s ON s.ITNBR = rva.ITNBR
            FULL JOIN AMFLIB3.ITMPLN i ON i.itnb = rva.ITNBR
            WHERE coc.STID = '02' AND coc.ITNBR = '${ref}' AND s.LQNTY > 0
            AND (s.llocn LIKE 'A%'  OR s.LLOCN  LIKE 'H%')  AND s.LLOCN != 'APDPL1'  AND s.LLOCN  != 'APDMR1' 
            LIMIT 1
        `;

        const result = await pool.query(query);
        // Exécuter la requête
        console.log("resultat=" ,result);
        if (result.length > 0) console.log('[UST305 raw]', result[0].UST305, typeof result[0].UST305);
        // Normalisation : le driver ODBC AS400 peut retourner certains champs
        // sous forme de Buffer ou d'objet — on les convertit en types primitifs
        const mapped = result.map(row => ({
            ITNBR:  row.ITNBR?.trim(),
            ITDSC:  decodeEBCDIC(row.ITDSC),
            UST305: decodeEBCDIC(row.UST305),
            UNMSR:  decodeEBCDIC(row.UNMSR),
            LQNTY:  row.LQNTY,
            LLOCN:  decodeEBCDIC(row.LLOCN),
            MULQ:   row.MULQ,
        }));
        console.log(mapped);

        return res.status(200).json({
            success: true,
            data: mapped
        });
    }
    catch (e){
        console.error('Erreur getWareHouses:', e);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des entrepôts',
            error: e.message
        });
    }
}

async function getStocksByRef(req, res) {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({ success: false, message: 'Erreur de connexion à la base de données' });
        }

        const ref = (req.query.ref ?? '').trim().replace(/[^A-Z0-9a-z\-\.\/# ]/g, '');
        if (!ref) {
            return res.status(400).json({ success: false, message: 'Le paramètre ref est requis' });
        }

        const query = `
            SELECT LLOCN, LQNTY, MULQ  FROM(
                SELECT LQNTY, LLOCN,  MULQ,
                ROW_NUMBER() OVER (PARTITION BY s.LLOCN ORDER BY s.LQNTY) AS rn
                FROM AMFLIB3.SLQNTY s
                INNER JOIN AMFLIB3.ITMPLN i ON i.itnb = s.ITNBR
                WHERE s.ITNBR = '${ref}' AND s.LQNTY > 0
                AND (s.llocn LIKE 'A%'  OR s.LLOCN  LIKE 'H%')
                AND s.LLOCN != 'APDPL1'  AND s.LLOCN  != 'APDMR1'
            )t
            WHERE t.rn =1
        `;

        const result = await pool.query(query);
        const mapped = result.map(row => ({
            LLOCN: decodeEBCDIC(row.LLOCN),
            LQNTY: row.LQNTY,
            MULQ: row.MULQ,
        }));

        return res.status(200).json({ success: true, data: mapped });
    } catch (e) {
        console.error('Erreur getStocksByRef:', e);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des stocks', error: e.message });
    }
}

async function getUnitesGestion(req, res) {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({ success: false, message: 'Erreur de connexion à la base de données' });
        }

        const query = `
            SELECT DISTINCT UNMSR FROM AMFLIB3.ITMRVA WHERE UNMSR IS NOT NULL
            
        `;

        const result = await pool.query(query);
        const mapped = result.map(row => ({
            nom: typeof row.UNMSR === 'object' ? decodeEBCDIC(row.UNMSR) : row.UNMSR?.toString().trim(),
        }));

        return res.status(200).json({ success: true, data: mapped });
    } catch (e) {
        console.error('Erreur getUnitesGestion:', e);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des unités de gestion', error: e.message });
    }
}

module.exports = {
    getProductByRef,
    getStocksByRef,
    getUnitesGestion,
};