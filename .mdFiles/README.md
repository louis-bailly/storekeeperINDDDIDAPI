# StoreKeeper API

API backend pour l'application StoreKeeperV2 - Système d'authentification par badge.

## 📋 Prérequis

- Node.js (v14+)
- Accès à une base de données IBM i DB2
- Driver ODBC IBM i Access installé

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Port du serveur
PORT=3000

# Configuration DB2
DB_HOST='votre-serveur'
DB_USER='votre-utilisateur'
DB_PASSWORD='votre-mot-de-passe'

# JWT Secret (changez-le en production!)
JWT_SECRET='votre-secret-jwt-super-securise'
```

## 🗄️ Structure de la base de données

L'API attend une table utilisateur avec la structure suivante :

```sql
-- Exemple de structure (à adapter selon votre schéma)
CREATE TABLE AMFLIB3.MOMASTPS (
    ID INT NOT NULL PRIMARY KEY,
    BADGE_NUMBER VARCHAR(20) NOT NULL UNIQUE,
    NAME VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(100),
    ROLE VARCHAR(50) DEFAULT 'user',
    IS_ACTIVE INT DEFAULT 1
)
```

**IMPORTANT** : Remplacez `AMFLIB3.MOMASTPS` dans le fichier `controllers/Login/LoginController.js` par votre vraie table d'utilisateurs et ajustez les noms de colonnes selon votre schéma.

## 🏃‍♂️ Démarrage

```bash
node app.js
```

L'API démarrera sur `http://localhost:3000` (ou le port configuré dans .env)

## 📡 Endpoints

### 1. Login par badge

**POST** `/api/v1/auth/login`

Authentifie un utilisateur par son numéro de badge.

**Body:**
```json
{
  "badgeNumber": "B001"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "badgeNumber": "B001",
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user"
  }
}
```

**Erreurs:**
- `400` : Badge manquant
- `401` : Badge non reconnu
- `500` : Erreur serveur

### 2. Vérifier le token

**GET** `/api/v1/auth/verify`

Vérifie la validité du token JWT et retourne les infos utilisateur.

**Headers:**
```
Authorization: Bearer <votre-token>
```

**Réponse (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "badgeNumber": "B001",
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user"
  }
}
```

**Erreurs:**
- `401` : Token manquant, invalide ou expiré
- `500` : Erreur serveur

## 🔐 Middleware d'authentification

Pour protéger vos routes, utilisez le middleware `authMiddleware` :

```javascript
const authMiddleware = require('./authMiddleware');

// Route protégée
app.get('/api/v1/protected', authMiddleware, (req, res) => {
    // req.user contient les infos de l'utilisateur (userId, badgeNumber, role)
    res.json({
        message: 'Route protégée',
        user: req.user
    });
});
```

## 📱 Intégration avec StoreKeeperV2 (React Native)

Modifiez votre `AuthService.ts` pour utiliser cette API :

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

static async verifyToken(): Promise<User | null> {
    try {
        const token = await this.getToken();
        if (!token) return null;

        const response = await fetch(`${API_URL}/api/v1/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            await this.logout();
            return null;
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Erreur vérification token:', error);
        await this.logout();
        return null;
    }
}
```

## 🏗️ Architecture

```
StoreKeeperAPI/
├── app.js                          # Point d'entrée de l'application
├── .env                            # Variables d'environnement
├── package.json                    # Dépendances
├── controllers/
│   └── Login/
│       └── LoginController.js      # Logique d'authentification
├── middlewares/
│   └── authMiddleware.js           # Protection des routes
└── routes/
    └── Login/
        └── LoginRoute.js           # Routes d'authentification
```

## 🔧 Technologies

- **Express** : Framework web
- **ODBC** : Connexion à DB2 IBM i
- **JWT** : Authentification par token
- **dotenv** : Gestion des variables d'environnement

## 📝 Notes importantes

1. **Sécurité** : Changez le `JWT_SECRET` en production avec une valeur aléatoire forte
2. **Table DB** : Adaptez les requêtes SQL selon votre schéma de base de données
3. **Token** : Les tokens JWT expirent après 24h par défaut
4. **CORS** : Ajoutez le middleware CORS si l'API est appelée depuis un domaine différent

## 🆘 Dépannage

### Erreur de connexion DB2
- Vérifiez que le driver IBM i Access ODBC est installé
- Vérifiez les credentials dans le `.env`
- Testez la connexion avec un client DB2

### Token invalide
- Vérifiez que le `JWT_SECRET` est le même partout
- Vérifiez le format de l'en-tête Authorization: `Bearer <token>`

## 📄 Licence

ISC

