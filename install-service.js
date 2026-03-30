const Service = require('node-windows').Service;

const svc = new Service({
    name: 'StoreKeeper API',
    description: 'StoreKeeper REST API Node.js',
    script: 'C:\\Storekeeper_Api\\app.js',
    workingDirectory: 'C:\\Storekeeper_Api'
});

svc.on('install', () => {
    svc.start();
    console.log('Service installé et démarré');
});

svc.install();
