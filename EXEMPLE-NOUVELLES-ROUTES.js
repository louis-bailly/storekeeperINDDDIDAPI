// ===================================================
// EXEMPLE : Comment ajouter de nouvelles routes
// ===================================================

// 1️⃣ Créer un controller : controllers/Inventory/InventoryController.js

const { getPool } = require('../../app');

/**
 * Récupérer tous les articles de l'inventaire
 */
async function getAllItems(req, res) {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        // REMPLACEZ par votre vraie table
        const query = `
            SELECT 
                ID,
                ITEM_CODE,
                ITEM_NAME,
                QUANTITY,
                LOCATION
            FROM VOTRE_BIBLIOTHEQUE.VOTRE_TABLE_ITEMS
            ORDER BY ITEM_NAME
        `;

        const result = await pool.query(query);

        return res.status(200).json({
            success: true,
            count: result.length,
            items: result
        });

    } catch (error) {
        console.error('Erreur getAllItems:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des articles',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Récupérer un article par son code
 */
async function getItemByCode(req, res) {
    try {
        const { code } = req.params;

        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        const query = `
            SELECT 
                ID,
                ITEM_CODE,
                ITEM_NAME,
                QUANTITY,
                LOCATION
            FROM VOTRE_BIBLIOTHEQUE.VOTRE_TABLE_ITEMS
            WHERE ITEM_CODE = ?
            FETCH FIRST 1 ROWS ONLY
        `;

        const result = await pool.query(query, [code]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product non trouvé'
            });
        }

        return res.status(200).json({
            success: true,
            item: result[0]
        });

    } catch (error) {
        console.error('Erreur getItemByCode:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'article'
        });
    }
}

/**
 * Mettre à jour la quantité d'un article
 */
async function updateQuantity(req, res) {
    try {
        const { code } = req.params;
        const { quantity } = req.body;

        // Validation
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({
                success: false,
                message: 'Quantité invalide'
            });
        }

        const pool = getPool();
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données'
            });
        }

        const query = `
            UPDATE VOTRE_BIBLIOTHEQUE.VOTRE_TABLE_ITEMS
            SET QUANTITY = ?,
                UPDATED_AT = CURRENT_TIMESTAMP,
                UPDATED_BY = ?
            WHERE ITEM_CODE = ?
        `;

        // req.user contient les infos de l'utilisateur (ajouté par authMiddleware)
        const result = await pool.query(query, [
            quantity,
            req.user.badgeNumber,  // Qui a fait la modification
            code
        ]);

        return res.status(200).json({
            success: true,
            message: 'Quantité mise à jour',
            item: {
                code,
                quantity,
                updatedBy: req.user.badgeNumber
            }
        });

    } catch (error) {
        console.error('Erreur updateQuantity:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour'
        });
    }
}

module.exports = {
    getAllItems,
    getItemByCode,
    updateQuantity
};


// 2️⃣ Créer les routes : routes/Inventory/InventoryRoute.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const InventoryController = require('../../controllers/Inventory/InventoryController');

/**
 * @route GET /api/v1/inventory/items
 * @desc Récupérer tous les articles
 * @access Private (nécessite un token JWT)
 */
router.get('/items', authMiddleware, InventoryController.getAllItems);

/**
 * @route GET /api/v1/inventory/items/:code
 * @desc Récupérer un article par code
 * @access Private
 */
router.get('/items/:code', authMiddleware, InventoryController.getItemByCode);

/**
 * @route PUT /api/v1/inventory/items/:code/quantity
 * @desc Mettre à jour la quantité d'un article
 * @access Private
 */
router.put('/items/:code/quantity', authMiddleware, InventoryController.updateQuantity);

module.exports = router;


// 3️⃣ Ajouter dans app.js

// Ajouter cette ligne après les autres imports de routes (ligne ~30)
const inventoryRoutes = require('./routes/Inventory/InventoryRoute');

// Ajouter cette ligne après les autres app.use (ligne ~48)
app.use('/api/v1/inventory', inventoryRoutes);


// 4️⃣ Tester dans api-tests.http

/*
### Récupérer tous les articles
GET http://localhost:3000/api/v1/inventory/items
Authorization: Bearer YOUR_TOKEN_HERE

###

### Récupérer un article par code
GET http://localhost:3000/api/v1/inventory/items/ITEM001
Authorization: Bearer YOUR_TOKEN_HERE

###

### Mettre à jour la quantité
PUT http://localhost:3000/api/v1/inventory/items/ITEM001/quantity
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "quantity": 150
}
*/


// ===================================================
// EXEMPLE : Route publique (sans authentification)
// ===================================================

// Dans routes/Public/PublicRoute.js

const express = require('express');
const router = express.Router();

/**
 * @route GET /api/v1/public/status
 * @desc Statut de l'API
 * @access Public (pas besoin de token)
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;


// ===================================================
// EXEMPLE : Middleware de rôle (admin uniquement)
// ===================================================

// Dans middlewares/roleMiddleware.js

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // req.user a été ajouté par authMiddleware
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Rôle non défini'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé - Permissions insuffisantes'
            });
        }

        next();
    };
}

module.exports = requireRole;

// Utilisation dans une route:
// router.delete('/items/:id', authMiddleware, requireRole('admin'), deleteItem);


// ===================================================
// RÉSUMÉ : Pattern à suivre
// ===================================================

/*
1. Créer le CONTROLLER (logique métier)
   → controllers/NomModule/NomController.js
   → Exporter les fonctions

2. Créer les ROUTES
   → routes/NomModule/NomRoute.js
   → Importer le controller
   → Définir les routes (GET, POST, PUT, DELETE)
   → Ajouter authMiddleware si besoin de protection

3. ENREGISTRER dans app.js
   → Importer la route
   → app.use('/api/v1/nom-module', nomRoutes);

4. TESTER
   → Ajouter des tests dans api-tests.http
   → Tester avec/sans token selon la protection

5. DOCUMENTER
   → Ajouter des commentaires JSDoc
   → Mettre à jour README.md
*/


// ===================================================
// BONNES PRATIQUES
// ===================================================

/*
✅ Toujours valider les données d'entrée
✅ Gérer les erreurs avec try/catch
✅ Retourner des réponses cohérentes (success, message, data)
✅ Utiliser des codes HTTP appropriés (200, 400, 401, 404, 500)
✅ Logger les erreurs importantes
✅ Protéger les routes sensibles avec authMiddleware
✅ Utiliser des paramètres préparés (?) pour éviter les injections SQL
✅ Documenter vos endpoints
✅ Tester avant de déployer
*/

