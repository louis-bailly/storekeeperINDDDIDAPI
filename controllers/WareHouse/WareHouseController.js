const jwt = require('jsonwebtoken');
const { getPool } = require('../../db/connection');


async function getWareHouses(req, res) {
    try{

        const result = [{ id: '0', nom:'EMAAS', emplacementCible : 'Assemblage' },{ id : 1, nom:'EMAPL', emplacementCible : 'Plating' },{ id : 2, nom:'EMAMO', emplacementCible : 'Moulage' },{ id : 3, nom:'EMADE', emplacementCible : 'Découpe' }]


        return res.status(200).json({
            success: true,
            data: result
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

async function getWareHousesForStock(req,res) {
    try{
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        console.log('ref:', ref, '| atelier:', atelier);

        if (!ref) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre ref est requis'
            });
        }

        const whereAtelier = atelier ? `AND s.LLOCN = '${atelier}'` : '';
        const query = `
            SELECT s.LLOCN FROM amflib3.SLDATA s
            WHERE (s.llocn LIKE 'A%' OR s.llocn LIKE "H%")
            AND s.LLOCN != 'APDPL1'  
            AND s.LLOCN  != 'APDMR1'
            AND   s.HOUSE = '06'
        `;

        const emplacement = result.map(row => row.LLOCN?.trim());

        return res.status(200).json({
            success: true,
            data: emplacement
        });

    }
    catch (e){
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la récupérations des stocks (stacktrace = WareHouseController.getWareHousesForStock) : " + e.message,
            data: []
        })
    }
}

module.exports = {
    getWareHouses
};
