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

        const query = `
            SELECT coc.ITNBR, CAST(CAST(rva.ITDSC AS CHAR(30) CCSID 37) AS VARCHAR(30) CCSID 1208) AS ITDSC, coc.UST305, CAST(CAST(rva.UNMSR AS CHAR(2) CCSID 37) AS VARCHAR(2) CCSID 1208) AS UNMSR, s.LQNTY, CAST(CAST(s.LLOCN AS CHAR(7) CCSID 37) AS VARCHAR(7) CCSID 1208) AS LLOCN, i.MULQ
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
            ITDSC:  row.ITDSC?.trim(),
            UST305: row.UST305?.trim(),
            UNMSR:  row.UNMSR?.trim(),
            LQNTY:  row.LQNTY,
            LLOCN:  row.LLOCN?.trim(),
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
                SELECT LQNTY, CAST(CAST(s.LLOCN AS CHAR(7) CCSID 37) AS VARCHAR(7) CCSID 1208) AS LLOCN, MULQ,
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
            LLOCN: row.LLOCN?.trim(),
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
            SELECT DISTINCT CAST(CAST(UNMSR AS CHAR(2) CCSID 37) AS VARCHAR(2) CCSID 1208) AS UNMSR FROM AMFLIB3.ITMRVA WHERE UNMSR IS NOT NULL
        `;

        const result = await pool.query(query);
        const mapped = result.map(row => ({
            nom: row.UNMSR?.trim(),
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