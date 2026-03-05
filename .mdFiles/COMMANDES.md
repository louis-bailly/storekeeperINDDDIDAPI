# 📋 Commandes Utiles - StoreKeeper API

## 🚀 Démarrage

```bash
# Démarrage normal
npm start

# Mode développement avec auto-reload
npm run dev

# Arrêter le serveur : Ctrl+C
```

## 📦 Gestion des packages

```bash
# Installer les dépendances
npm install

# Installer un nouveau package
npm install nom-du-package

# Installer en dev (uniquement pour le développement)
npm install --save-dev nom-du-package

# Mettre à jour les packages
npm update

# Voir les packages installés
npm list --depth=0
```

## 🗄️ Base de données

```bash
# Se connecter à DB2 (depuis un client DB2)
# Exemple avec ODBC:
# db2 connect to SYSTEM user UTILISATEUR using MOT_DE_PASSE

# Exécuter le script de création de table
# (depuis votre client DB2, exécutez database-setup.sql)

# Vérifier les données
# SELECT * FROM AMFLIB3.USERS;

# Compter les utilisateurs actifs
# SELECT COUNT(*) FROM AMFLIB3.USERS WHERE IS_ACTIVE = 1;
```

## 🧪 Tests

```bash
# Avec curl (Windows PowerShell)
# Test de base
curl http://localhost:3000

# Login
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"badgeNumber\": \"B001\"}'

# Vérifier token (remplacez VOTRE_TOKEN)
curl -X GET http://localhost:3000/api/v1/auth/verify `
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 🔍 Debugging

```bash
# Voir les logs en temps réel
npm start

# Mode verbose pour Node.js
$env:NODE_DEBUG="*"; npm start

# Vérifier les variables d'environnement
node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"
```

## 🛠️ Développement

```bash
# Créer un nouveau dossier pour un module
New-Item -ItemType Directory -Path "controllers/NouveauModule"
New-Item -ItemType Directory -Path "routes/NouveauModule"

# Créer un fichier
New-Item -ItemType File -Path "controllers/NouveauModule/NouveauController.js"
```

## 📝 Git (versionning)

```bash
# Initialiser Git
git init

# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Créer un commit
git commit -m "Initial commit - StoreKeeper API"

# Voir le statut
git status

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b nouvelle-fonctionnalite

# Revenir sur main
git checkout main
```

## 🔐 Sécurité

```bash
# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement (attention aux breaking changes)
npm audit fix

# Générer un nouveau JWT_SECRET (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (Get-Random)))

# Ou plus simple:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitoring

```bash
# Voir les processus Node.js actifs
Get-Process node

# Voir quel processus utilise le port 3000 (PowerShell)
netstat -ano | findstr :3000

# Tuer un processus par son PID
Stop-Process -Id PID_NUMBER -Force
```

## 🧹 Nettoyage

```bash
# Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# Réinstaller proprement
npm install

# Nettoyer le cache npm
npm cache clean --force
```

## 📤 Déploiement

```bash
# Créer un .zip pour déploiement (exclure node_modules)
Compress-Archive -Path *.js,*.json,*.md,controllers,middlewares,routes,.env.example -DestinationPath StoreKeeperAPI.zip

# Sur le serveur, après transfert:
# 1. Décompresser
# 2. npm install
# 3. Créer le fichier .env
# 4. npm start
```

## 🐛 Dépannage Express

```bash
# Vérifier la version de Node.js
node --version

# Vérifier la version de npm
npm --version

# Réinstaller Express
npm uninstall express
npm install express@5.2.1

# Vérifier qu'Express fonctionne
node -e "const express = require('express'); console.log('Express OK');"
```

## 🔌 Dépannage DB2/ODBC

```bash
# Vérifier que le driver ODBC est installé
# Ouvrir "ODBC Data Sources (64-bit)" dans Windows
# Chercher "IBM i Access ODBC Driver"

# Tester la connexion ODBC (PowerShell)
node -e "const odbc = require('odbc'); console.log('ODBC module OK');"

# Tester la connexion complète
node -e "require('dotenv').config(); const odbc = require('odbc'); const cs = 'DRIVER={IBM i Access ODBC Driver};SYSTEM=' + process.env.DB_HOST + ';UID=' + process.env.DB_USER + ';PWD=' + process.env.DB_PASSWORD; odbc.connect(cs).then(() => console.log('DB OK')).catch(e => console.error(e));"
```

## 📱 Tests avec l'app React Native

```bash
# Trouver l'IP locale de votre PC (PowerShell)
ipconfig | findstr IPv4

# Utiliser cette IP dans l'app React Native
# const API_URL = 'http://192.168.X.X:3000';

# S'assurer que le firewall autorise le port 3000
# Panneau de configuration > Pare-feu Windows > Règles entrantes
```

## 🚨 Commandes d'urgence

```bash
# Arrêter TOUS les processus Node.js
Get-Process node | Stop-Process -Force

# Redémarrer avec logs détaillés
$env:DEBUG="*"; npm start

# Réinitialiser complètement le projet
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm start
```

## 💡 Astuces

```bash
# Créer un alias pour démarrer rapidement
# Dans votre profil PowerShell (~\Documents\PowerShell\Profile.ps1):
# function Start-StoreKeeperAPI { 
#     cd "C:\Users\louis.bailly\WebstormProjects\StoreKeeperAPI"
#     npm start 
# }

# Puis utiliser simplement:
# Start-StoreKeeperAPI
```

## 📖 Ressources

- Express : https://expressjs.com/
- ODBC : https://github.com/markdirish/node-odbc
- JWT : https://jwt.io/
- Node.js : https://nodejs.org/

---

**💡 Conseil** : Gardez ce fichier à portée de main pendant le développement !

