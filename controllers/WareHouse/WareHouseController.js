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

module.exports = {
    getWareHouses
};
