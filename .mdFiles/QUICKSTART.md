# 🚀 Guide de Démarrage Rapide - StoreKeeper API

## ⚡ Installation en 5 minutes

### 1️⃣ Installer les dépendances
```bash
npm install
```

### 2️⃣ Configurer la base de données

**Option A : Créer une nouvelle table**
- Ouvrez `database-setup.sql`
- Adaptez le nom de la bibliothèque si nécessaire (remplacez `AMFLIB3`)
- Exécutez le script dans votre DB2

**Option B : Utiliser une table existante**
- Ouvrez `controllers/Login/LoginController.js`
- Remplacez `AMFLIB3.MOMASTPS` par votre table (lignes 36 et 131)
- Adaptez les noms de colonnes selon votre schéma

### 3️⃣ Vérifier le fichier .env
```env
DB_HOST='switch21'
DB_USER='d1hirel'
DB_PASSWORD='d1hirel'
JWT_SECRET='storekeeper_super_secret_key_2024_change_me_in_production'
PORT=3000
```

### 4️⃣ Démarrer le serveur
```bash
npm start
```

Vous devriez voir :
```
Connecté à DB2 IBM i
StoreKeeper API listening on port 3000
```

### 5️⃣ Tester l'API

**Ouvrir** `api-tests.http` dans WebStorm et cliquer sur "▶" pour le test #2 (Login)

Ou avec curl :
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"badgeNumber\": \"B001\"}"
```

**Réponse attendue** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "badgeNumber": "B001",
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "admin"
  }
}
```

## ✅ C'est prêt !

### Prochaines étapes :

1. **Tester tous les endpoints** avec `api-tests.http`
2. **Intégrer avec l'app React Native** (voir README.md)
3. **Ajouter vos propres routes** (voir `routes/ExampleRoute.js`)

## 🆘 Problèmes ?

### Le serveur ne démarre pas
- Vérifiez que le driver IBM i Access ODBC est installé
- Vérifiez les credentials dans `.env`

### "Badge non reconnu"
- Vérifiez que la table et les colonnes existent
- Vérifiez qu'il y a des utilisateurs avec `IS_ACTIVE = 1`
- Vérifiez que le nom de la table est correct dans `LoginController.js`

### Port déjà utilisé
- Changez `PORT=3001` dans `.env`

## 📚 Documentation complète

- **README.md** : Documentation détaillée de l'API
- **CONFIGURATION.md** : Guide de configuration complet
- **api-tests.http** : Tests de tous les endpoints

---

**Besoin d'aide ?** Consultez `CONFIGURATION.md` pour plus de détails !

