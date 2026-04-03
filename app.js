const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/connection');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permettre les requêtes cross-origin
app.use(express.json()); // Parser les requêtes JSON

// Routes
const loginRoutes = require('./routes/Login/LoginRoute');
const exampleRoutes = require('./routes/ExampleRoute');
const wareHouseRoutes = require('./routes/WareHouse/WareHouseRoute');
const productRoutes = require('./routes/Product/ProductRoute');
const transferRoutes = require('./routes/Transfer/TransferRoute');

app.get('/', (req, res) => {
    res.json({
        message: 'StoreKeeper API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            example: '/api/v1/example',
            wareHouse: '/api/v1/wareHouse'
        }
    });
});

// Téléchargement APK mobile (auto-update)
app.use('/apk', express.static(path.join(__dirname, 'apk')));

app.use('/oauth', loginRoutes);
app.use('/api/v1/auth', loginRoutes);
app.use('/api/v1/example', exampleRoutes);
app.use('/api/v1/wareHouse', wareHouseRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stock', transferRoutes);

// Initialiser la DB puis démarrer le serveur
initDB().then(() => {
    app.listen(port, () => {
        console.log(`StoreKeeper API listening on port ${port}`);
    });
});
