# 📝 Configuration finale - StoreKeeper API

## ✅ Ce qui a été fait

### 1. **Correction de l'erreur DB2**
- ✅ Déplacement de `connectionString` dans la fonction `initDB()`
- ✅ Export de la fonction `getPool()` pour accès au pool depuis les controllers

### 2. **Système d'authentification JWT**
- ✅ `LoginController.js` : Login par badge avec vérification DB2
- ✅ Génération de token JWT (validité 24h)
- ✅ Route de vérification du token
- ✅ Middleware `authMiddleware.js` pour protéger les routes

### 3. **Architecture mise en place**
```
StoreKeeperAPI/
├── app.js                          # ✅ Point d'entrée + config DB2 + CORS
├── .env                            # ✅ Variables d'environnement
├── .env.example                    # ✅ Template pour .env
├── package.json                    # ✅ Dépendances + scripts
├── README.md                       # ✅ Documentation complète
├── api-tests.http                  # ✅ Fichier de tests HTTP
├── .gitignore                      # ✅ Fichiers à ignorer
├── controllers/
│   └── Login/
│       └── LoginController.js      # ✅ Logique d'authentification
├── middlewares/
│   └── authMiddleware.js           # ✅ Protection des routes
└── routes/
    ├── Login/
    │   └── LoginRoute.js           # ✅ Routes d'auth
    └── ExampleRoute.js             # ✅ Exemple de routes protégées
```

### 4. **Packages installés**
- ✅ express (serveur web)
- ✅ odbc (connexion DB2)
- ✅ dotenv (variables d'environnement)
- ✅ jsonwebtoken (JWT auth)
- ✅ cors (requêtes cross-origin)
- ✅ nodemon (dev - redémarrage auto)

## ⚠️ IMPORTANT - À FAIRE MAINTENANT

### 1. **Adapter la requête SQL à votre base de données**

Ouvrez `controllers/Login/LoginController.js` et **remplacez** :

```javascript
const query = `
    SELECT 
        ID,
        BADGE_NUMBER,
        NAME,
        EMAIL,
        ROLE,
        IS_ACTIVE
    FROM AMFLIB3.MOMASTPS 
    WHERE BADGE_NUMBER = ? 
    AND IS_ACTIVE = 1
    LIMIT 1
`;
```

Par **VOTRE** vraie table et colonnes. Par exemple :

```javascript
const query = `
    SELECT 
        ID_UTILISATEUR as ID,
        NUM_BADGE as BADGE_NUMBER,
        NOM_COMPLET as NAME,
        EMAIL,
        ROLE,
        ACTIF as IS_ACTIVE
    FROM VOTRE_BIBLIOTHEQUE.VOTRE_TABLE_USERS 
    WHERE NUM_BADGE = ? 
    AND ACTIF = 1
    FETCH FIRST 1 ROWS ONLY
`;
```

**Attention** : 
- Remplacez `AMFLIB3.MOMASTPS` par votre table
- Adaptez les noms de colonnes
- Sur DB2/AS400, utilisez `FETCH FIRST 1 ROWS ONLY` au lieu de `LIMIT 1`

### 2. **Faire la même chose pour la route verify**

Ligne ~131 dans `LoginController.js` :

```javascript
const query = `
    SELECT ID, BADGE_NUMBER, NAME, EMAIL, ROLE
    FROM VOTRE_BIBLIOTHEQUE.VOTRE_TABLE_USERS 
    WHERE ID = ? AND IS_ACTIVE = 1
    FETCH FIRST 1 ROWS ONLY
`;
```

### 3. **Créer/Vérifier votre table utilisateurs**

Votre table doit avoir au minimum ces colonnes :
- **ID** : Identifiant unique
- **BADGE_NUMBER** : Numéro de badge (UNIQUE)
- **NAME** : Nom de l'utilisateur
- **IS_ACTIVE** : 1 = actif, 0 = inactif
- **EMAIL** (optionnel)
- **ROLE** (optionnel) : 'user', 'admin', etc.

Exemple de création de table :
```sql
CREATE TABLE AMFLIB3.USERS (
    ID INT NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    BADGE_NUMBER VARCHAR(20) NOT NULL UNIQUE,
    NAME VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(100),
    ROLE VARCHAR(50) DEFAULT 'user',
    IS_ACTIVE INT DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer un utilisateur de test
INSERT INTO AMFLIB3.USERS (BADGE_NUMBER, NAME, EMAIL, ROLE)
VALUES ('B001', 'Jean Dupont', 'jean.dupont@example.com', 'admin');
```

## 🚀 Démarrer l'API

```bash
# Mode normal
npm start

# Mode développement (redémarrage auto)
npm run dev
```

L'API démarre sur `http://localhost:3000` (ou le PORT dans .env)

## 🧪 Tester l'API

### Option 1 : Avec le fichier api-tests.http (recommandé)

Ouvrez `api-tests.http` dans WebStorm et cliquez sur les boutons "▶" pour exécuter les requêtes.

### Option 2 : Avec curl ou Postman

```bash
# Test de login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"badgeNumber\": \"B001\"}"

# Vérifier le token (remplacez VOTRE_TOKEN)
curl -X GET http://localhost:3000/api/v1/auth/verify \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 📱 Intégrer avec StoreKeeperV2

Dans votre `AuthService.ts`, remplacez la simulation par :

```typescript
static async login(badgeNumber: string): Promise<LoginResponse> {
    try {
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ badgeNumber }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Badge non reconnu');
        }

        const data: LoginResponse = await response.json();
        
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        return data;
    } catch (error) {
        throw error;
    }
}
```

Dans votre app React Native, changez :
```typescript
// const API_URL = 'http://localhost:3000';  // Dev local
const API_URL = 'http://IP_DE_VOTRE_SERVEUR:3000';  // Serveur réel
```

## 🔐 Sécurité en Production

1. **Changez le JWT_SECRET** dans `.env` par une valeur aléatoire forte :
   ```env
   JWT_SECRET='votre-secret-aleatoire-super-long-et-securise-123456789'
   ```

2. **Utilisez HTTPS** en production (pas HTTP)

3. **Ajoutez des validations** sur les données d'entrée

4. **Limitez les tentatives de connexion** (rate limiting)

## 🐛 Dépannage

### "Erreur de connexion DB2"
- Vérifiez que le driver IBM i Access ODBC est installé
- Testez les credentials dans `.env`
- Vérifiez que le serveur DB2 est accessible

### "Badge non reconnu" alors que le badge existe
- Vérifiez les noms de colonnes dans la requête SQL
- Vérifiez que `IS_ACTIVE = 1`
- Affichez le résultat de la requête avec `console.log(result)` pour débugger

### Port déjà utilisé
- Changez le PORT dans `.env` : `PORT=3001`
- Ou arrêtez le processus qui utilise le port 3000

## 📞 Contact & Support

Pour toute question, référez-vous au `README.md` pour la documentation complète.

---
**Prochaines étapes suggérées** :
1. ✅ Adapter les requêtes SQL
2. ✅ Tester le login avec un badge réel
3. ✅ Intégrer avec l'app React Native
4. ✅ Ajouter d'autres routes (inventaire, scan, etc.)

