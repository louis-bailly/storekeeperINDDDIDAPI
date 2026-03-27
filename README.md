# StoreKeeperAPI — Backend REST

API REST Node.js/Express faisant le pont entre l'application mobile **StoreKeeper V2** et le système **IBM i (AS400)**. Elle gère l'authentification, les entrepôts, les produits, les stocks et les transferts.

---

## Fonctionnalités

- **Authentification OAuth2 / JWT** — Tokens d'accès (15 min) + refresh tokens (7 jours), auth par badge
- **Gestion des entrepôts** — Consultation des données d'entrepôt depuis l'AS400
- **Gestion des produits** — Récupération du catalogue articles
- **Stocks & Transferts** — Lecture des niveaux de stock, enregistrement de transferts
- **Intégration AS400** — Appels directs aux programmes RPG via `itoolkit` (XML-RPC)

---

## Stack technique

| Technologie | Version |
|-------------|---------|
| Node.js | ≥ 22 |
| Express | 5.2.1 |
| jsonwebtoken | 9.0.3 |
| odbc | 2.4.9 |
| itoolkit | 1.0.2 |
| dotenv | 17.2.4 |

---

## Prérequis

- **Node.js** ≥ 22
- **Driver ODBC IBM i Access** installé sur la machine hôte
- Accès réseau à un système **IBM i (AS400)**
- Droits d'exécution sur les programmes RPG `LSTGETITM` et `CLPZNXTRN`

---

## Installation & Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier de configuration
cp .env.example .env
# Éditer .env avec vos paramètres AS400

# 3. Démarrer en mode développement (rechargement automatique)
npm run dev

# 4. Ou démarrer en production
npm start
```

L'API écoute sur le port configuré (par défaut : `3000`).

---

## Configuration `.env`

Copiez `.env.example` en `.env` et renseignez les variables suivantes :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute du serveur | `3000` |
| `DB_HOST` | Adresse du serveur IBM i | `192.168.1.100` |
| `DB_USER` | Utilisateur AS400 | `MONUSER` |
| `DB_PASSWORD` | Mot de passe AS400 | `monmotdepasse` |
| `JWT_SECRET` | Clé secrète de signature JWT | `une-chaine-aleatoire-longue` |
| `JWT_EXPIRES_IN` | Durée de vie du token d'accès | `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Durée de vie du refresh token (jours) | `7` |
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |
| `PLR_PROGRAM` | Nom du programme RPG de prélèvement | `MYPGM` |
| `PLR_USER` | Utilisateur pour l'exécution RPG | `MYUSER` |

---

## Endpoints API

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/oauth/token` | Obtenir un token (`grant_type=password` ou `refresh_token`) |
| `POST` | `/oauth/revoke` | Révoquer un token (déconnexion) |
| `GET` | `/api/v1/auth/verify` | Vérifier la validité d'un token |

### Entrepôts

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/v1/wareHouse` | Récupérer les données d'entrepôt |

### Produits

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/v1/products` | Récupérer le catalogue articles |

### Stocks & Transferts

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/v1/stock` | Consulter les niveaux de stock |
| `POST` | `/api/v1/stock` | Enregistrer un transfert / prélèvement |

---

## Architecture

```
StoreKeeperAPI/
├── app.js                  # Point d'entrée, configuration Express
├── db/
│   └── connection.js       # Initialisation du pool ODBC
├── routes/                 # Définition des routes Express
│   ├── Login/
│   ├── Product/
│   ├── Transfer/
│   ├── WareHouse/
│   └── Needs/
├── controllers/            # Logique de traitement des requêtes
│   ├── Login/
│   ├── Product/
│   ├── Transfer/
│   ├── WareHouse/
│   └── Needs/
├── middlewares/
│   └── authMiddleware.js   # Vérification JWT
├── services/
│   └── As400Service.js     # Appels XML-RPC vers IBM i
└── .env.example
```

Le flux d'une requête suit le schéma : **Route → Middleware Auth → Controller → Service AS400 → Réponse JSON**

---

## Authentification

L'API implémente un flux OAuth 2.0 simplifié :

1. Le client envoie un `POST /oauth/token` avec `grant_type=password`, `username` (badge) et `password`
2. L'API vérifie l'utilisateur dans la table `AMFLIB3.EMPMAS` de l'AS400
3. En cas de succès, retourne un `access_token` (JWT, 15 min) et un `refresh_token` (7 jours)
4. Le client inclut `Authorization: Bearer <access_token>` dans chaque requête protégée
5. Quand l'access token expire, le client utilise le refresh token pour en obtenir un nouveau

---

## Intégration AS400

La communication avec IBM i utilise deux mécanismes :

- **ODBC** (`odbc`) — requêtes SQL sur les tables AS400 (lecture des utilisateurs, articles, stocks)
- **XML-RPC** (`itoolkit`) — appel de programmes RPG compilés :
  - `LSTGETITM.PGM` — Récupération de la liste des articles
  - `CLPZNXTRN.PGM` — Enregistrement d'un transfert de zone

---

© 2026 StoreKeeper API
