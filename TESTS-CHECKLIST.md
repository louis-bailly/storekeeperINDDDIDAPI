# 🧪 Checklist de Test - StoreKeeper API

## ✅ Tests à effectuer avant utilisation

### 📋 Pré-requis

- [ ] Le serveur démarre sans erreur (`npm start`)
- [ ] Message "Connecté à DB2 IBM i" s'affiche
- [ ] Message "StoreKeeper API listening on port 3000" s'affiche

Si un des messages ne s'affiche pas, voir CONFIGURATION.md section "Dépannage"

---

## 🔧 Test 1 : API de base

### Vérifier que l'API répond

**Méthode** : Ouvrir `api-tests.http`, Test #1

**Ou en ligne de commande** :
```bash
curl http://localhost:3000
```

**Résultat attendu** :
```json
{
  "message": "StoreKeeper API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/v1/auth",
    "example": "/api/v1/example"
  }
}
```

- [ ] ✅ L'API répond correctement

---

## 🔐 Test 2 : Login avec badge

### Test avec un badge qui existe

**Pré-requis** : Avoir un utilisateur de test dans la DB

**Méthode** : Fichier `api-tests.http`, Test #2

**Ou en ligne de commande** :
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"badgeNumber\": \"B001\"}"
```

**Résultat attendu** :
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

- [ ] ✅ Le login fonctionne
- [ ] ✅ Un token JWT est retourné
- [ ] ✅ Les infos utilisateur sont correctes

**⚠️ Si erreur "Badge non reconnu"** :
1. Vérifiez que la table contient des données
2. Vérifiez le nom de la table dans `LoginController.js`
3. Vérifiez que `IS_ACTIVE = 1`
4. Exécutez dans votre DB2 :
   ```sql
   SELECT * FROM VOTRE_TABLE WHERE BADGE_NUMBER = 'B001';
   ```

---

## 🔐 Test 3 : Login avec badge invalide

**Méthode** : Fichier `api-tests.http`, Test #3

**Résultat attendu** :
```json
{
  "success": false,
  "message": "Badge non reconnu"
}
```

**Code HTTP** : 401 (Unauthorized)

- [ ] ✅ L'erreur est correctement gérée

---

## 🔐 Test 4 : Login sans badge

**Méthode** : Fichier `api-tests.http`, Test #4

**Résultat attendu** :
```json
{
  "success": false,
  "message": "Le numéro de badge est requis"
}
```

**Code HTTP** : 400 (Bad Request)

- [ ] ✅ La validation fonctionne

---

## 🎫 Test 5 : Vérifier le token

### Avec un token valide

**Pré-requis** : Avoir fait un login et copié le token

**Méthode** : 
1. Copier le token du Test #2
2. Dans `api-tests.http`, Test #5, remplacer `YOUR_TOKEN_HERE`
3. Exécuter le test

**Résultat attendu** :
```json
{
  "success": true,
  "user": {
    "id": 1,
    "badgeNumber": "B001",
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "admin"
  }
}
```

- [ ] ✅ La vérification du token fonctionne
- [ ] ✅ Les infos utilisateur sont retournées

---

## 🎫 Test 6 : Token invalide

**Méthode** : Fichier `api-tests.http`, Test #6

**Résultat attendu** :
```json
{
  "success": false,
  "message": "Token invalide"
}
```

**Code HTTP** : 401

- [ ] ✅ Les tokens invalides sont rejetés

---

## 🎫 Test 7 : Sans token

**Méthode** : Fichier `api-tests.http`, Test #7

**Résultat attendu** :
```json
{
  "success": false,
  "message": "Token manquant"
}
```

**Code HTTP** : 401

- [ ] ✅ L'absence de token est détectée

---

## 🔒 Test 8 : Route protégée avec token

**Pré-requis** : Avoir un token valide

**Méthode** : 
1. Copier le token du Test #2
2. Dans `api-tests.http`, Test #8, remplacer `YOUR_TOKEN_HERE`
3. Exécuter le test

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Vous avez accès à cette route protégée!",
  "user": {
    "userId": 1,
    "badgeNumber": "B001",
    "role": "admin"
  }
}
```

- [ ] ✅ Le middleware authMiddleware fonctionne
- [ ] ✅ Les infos user sont dans req.user

---

## 🔒 Test 9 : Route protégée sans token

**Méthode** : Fichier `api-tests.http`, Test #9

**Résultat attendu** :
```json
{
  "success": false,
  "message": "Accès non autorisé - Token manquant"
}
```

**Code HTTP** : 401

- [ ] ✅ L'accès est refusé sans token

---

## 🌍 Test 10 : Route publique

**Méthode** : Fichier `api-tests.http`, Test #10

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Cette route est publique, pas besoin de token"
}
```

- [ ] ✅ Les routes publiques fonctionnent sans token

---

## 📱 Test 11 : Intégration mobile (optionnel)

### Depuis l'app React Native

**Pré-requis** :
1. Trouver l'IP de votre PC : `ipconfig`
2. Dans l'app, utiliser : `const API_URL = 'http://192.168.X.X:3000'`

**Test** :
1. Scanner un badge dans l'app
2. Vérifier que l'app reçoit le token
3. Vérifier que l'utilisateur est connecté

- [ ] ✅ L'app mobile peut se connecter à l'API
- [ ] ✅ Le login fonctionne depuis l'app
- [ ] ✅ Le token est bien stocké

**⚠️ Si problème de connexion** :
- Vérifier que le PC et le mobile sont sur le même réseau
- Vérifier le pare-feu Windows (autoriser port 3000)
- Tester avec curl depuis le mobile : `curl http://IP_PC:3000`

---

## 🗄️ Test 12 : Connexion DB2 (avancé)

### Vérifier la connexion directe

**Méthode** : Exécuter dans PowerShell

```bash
node -e "require('dotenv').config(); const odbc = require('odbc'); const cs = 'DRIVER={IBM i Access ODBC Driver};SYSTEM=' + process.env.DB_HOST + ';UID=' + process.env.DB_USER + ';PWD=' + process.env.DB_PASSWORD; odbc.connect(cs).then(() => console.log('✅ Connexion DB2 OK')).catch(e => console.error('❌ Erreur:', e.message));"
```

- [ ] ✅ La connexion DB2 fonctionne en direct

**Si erreur** :
- Vérifier que le driver IBM i Access ODBC est installé
- Vérifier les credentials dans `.env`
- Tester avec un client DB2 externe

---

## 📊 Résumé des tests

| Test | Endpoint | Statut |
|------|----------|--------|
| 1. API de base | `GET /` | ⬜ |
| 2. Login valide | `POST /api/v1/auth/login` | ⬜ |
| 3. Login invalide | `POST /api/v1/auth/login` | ⬜ |
| 4. Login sans badge | `POST /api/v1/auth/login` | ⬜ |
| 5. Vérifier token valide | `GET /api/v1/auth/verify` | ⬜ |
| 6. Token invalide | `GET /api/v1/auth/verify` | ⬜ |
| 7. Sans token | `GET /api/v1/auth/verify` | ⬜ |
| 8. Route protégée + token | `GET /api/v1/example/protected` | ⬜ |
| 9. Route protégée - token | `GET /api/v1/example/protected` | ⬜ |
| 10. Route publique | `GET /api/v1/example/public` | ⬜ |
| 11. App mobile | (mobile) | ⬜ |
| 12. Connexion DB2 | (script) | ⬜ |

---

## ✅ Validation finale

Si TOUS les tests passent :
- [ ] ✅ L'API est fonctionnelle
- [ ] ✅ L'authentification fonctionne
- [ ] ✅ La connexion DB2 est OK
- [ ] ✅ Les middlewares fonctionnent
- [ ] ✅ L'API est prête pour le développement

Si un test échoue :
1. Consulter `CONFIGURATION.md` section "Dépannage"
2. Vérifier les logs du serveur
3. Vérifier les fichiers concernés

---

## 🎯 Prochaine étape

Une fois tous les tests OK :
→ Commencer à ajouter vos propres routes (voir `EXEMPLE-NOUVELLES-ROUTES.js`)

---

**💡 Astuce** : Gardez cet onglet `api-tests.http` ouvert dans WebStorm pour tester rapidement pendant le développement !

