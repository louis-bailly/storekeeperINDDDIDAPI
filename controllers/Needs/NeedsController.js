const { getPool } = require('../../db/connection');



async function getNeedsForWarehouse(req,res) {
    try{
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        const warehouseId = req.params.warehouseId;

        const query = `
        SELECT * FROM  WHERE  = ?`

    }
    catch (e){
        throw e.message;
    }
}