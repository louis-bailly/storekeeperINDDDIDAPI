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
        const ref = req.query.ref;
        if (!ref) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre ref est requis'
            });
        }
        const query = `
            SELECT coc.ITNBR, rva.ITDSC, coc.UST305, rva.UNMSR, s.LQNTY, s.LLOCN
            FROM INTE3FIC.ITMCOC coc
                     JOIN AMFLIB3.ITMRVA rva ON rva.ITNBR = coc.ITNBR
                     JOIN AMFLIB3.SLQNTY s ON s.ITNBR = rva.ITNBR
            WHERE coc.STID = '02' AND coc.ITNBR = ?
                LIMIT 1
        `;

        const result = await pool.query(query, [ref]);
        // Exécuter la requête
        console.log(result);
        // Normalisation : le driver ODBC AS400 peut retourner certains champs
        // sous forme de Buffer ou d'objet — on les convertit en types primitifs
        const mapped = result.map(row => ({
            ITNBR: row.ITNBR?.trim(),
            ITDSC: decodeEBCDIC(row.ITDSC),
            UST305: row.UST305?.trim(),
            UNMSR: decodeEBCDIC(row.UNMSR),
            LQNTY: row.LQNTY,
            LLOCN: decodeEBCDIC(row.LLOCN)
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

module.exports = {
    getProductByRef
};