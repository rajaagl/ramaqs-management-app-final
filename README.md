# RAMAQS Management

Application de gestion de projets pour RAMAQS Consulting. Elle centralise les projets, tâches, documents, utilisateurs et notifications, avec des droits d'accès adaptés aux rôles métier.

> Le projet est **mono-tenant** : il est conçu pour une seule organisation RAMAQS. Il ne contient pas de messagerie interne.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Rôles et accès](#rôles-et-accès)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes utiles](#commandes-utiles)
- [Sécurité](#sécurité)
- [Tests et qualité](#tests-et-qualité)
- [Structure des dossiers](#structure-des-dossiers)
- [Documentation associée](#documentation-associée)

## Fonctionnalités

- Inscription d'utilisateurs avec approbation par la direction.
- Authentification JWT, rafraîchissement de session et déconnexion avec invalidation du refresh token.
- Réinitialisation de mot de passe par lien à usage unique et limité dans le temps.
- Création et suivi des projets.
- Création, assignation et validation des tâches.
- Gestion des documents avec contrôle d'accès, validation de fichier et téléchargement protégé.
- Notifications personnelles en temps réel via WebSocket.
- Import de projets Excel pour des utilisateurs déjà créés et approuvés.
- Tableaux de bord et export de données.

## Stack technique

### Frontend

| Technologie | Usage |
|---|---|
| React 18 + TypeScript | Interface utilisateur typée |
| Vite | Serveur de développement et build de production |
| TanStack Router | Routage frontend |
| Redux Toolkit / RTK Query | État global et appels API |
| Tailwind CSS | Styles et interface responsive |
| DnD Kit | Glisser-déposer des tâches |
| Recharts | Graphiques du tableau de bord |
| jsPDF + AutoTable | Exports PDF |
| Vitest + Testing Library | Tests frontend |
| ESLint + Prettier | Qualité et formatage du code |

### Backend

| Technologie | Usage |
|---|---|
| Python + Django | Application backend et modèles métier |
| Django REST Framework | API REST |
| SimpleJWT | Authentification JWT |
| PostgreSQL | Base de données relationnelle |
| Django Channels + Daphne | API ASGI et WebSocket |
| Redis + channels-redis | Canal de notifications temps réel |
| Pillow | Validation des images de profil |
| OpenPyXL | Import Excel |
| django-filter | Filtres API |
| drf-yasg | Documentation Swagger/OpenAPI |

## Architecture

```text
Navigateur React
    │ HTTP / JWT / WebSocket
    ▼
Django REST Framework + Django Channels
    ├── PostgreSQL : utilisateurs, projets, tâches, documents, notifications
    ├── Redis : notifications temps réel WebSocket
    └── SMTP : emails d'approbation et réinitialisation de mot de passe
```

## Rôles et accès

| Rôle | Principales autorisations |
|---|---|
| Direction / super-admin | Gestion complète des utilisateurs, projets, tâches et documents |
| Chef de projet | Accès aux projets dont il est responsable ; création et validation des tâches du projet |
| Consultant | Accès à ses tâches ; mise à jour de leur avancement sans auto-validation |
| Client | Accès uniquement à ses projets et livrables autorisés |
| Partenaire | Accès aux projets auxquels il est associé |

Les autorisations sont contrôlées par le backend. Le frontend ne doit jamais être considéré comme une barrière de sécurité.

## Prérequis

Installer avant de démarrer :

- Python 3.12 ou version compatible avec Django 5.
- Node.js 22 LTS et npm.
- PostgreSQL 16 ou version compatible.
- Redis 7 ou version compatible.

## Installation locale

### 1. Récupérer le projet

```powershell
git clone <url-du-depot>
cd ramaqs-management-final
```

### 2. Démarrer PostgreSQL et Redis

Créer une base PostgreSQL puis vérifier que Redis écoute sur le port `6379`.

### 3. Configurer le backend

```powershell
cd "Backend Django/ramaqs_management_app"
Copy-Item .env.example .env
```

Modifier ensuite `.env` avec les informations locales de PostgreSQL, Redis et SMTP. Ne jamais versionner ce fichier.

Créer et activer l'environnement Python :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API locale : `http://127.0.0.1:8000/api/`

### 4. Configurer le frontend

Dans un second terminal :

```powershell
cd ramaqs-management-app
npm ci
npm run dev
```

Application locale : `http://127.0.0.1:3000/`

Par défaut, le frontend utilise l'API locale. Pour un environnement différent, définir `VITE_API_URL` et, si nécessaire, `VITE_WS_URL`.

## Variables d'environnement

Le modèle complet est disponible dans [Backend Django/ramaqs_management_app/.env.example](<Backend%20Django/ramaqs_management_app/.env.example>).

Variables importantes :

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Secret Django unique et long |
| `DJANGO_DEBUG` | `True` uniquement en local |
| `DJANGO_ALLOWED_HOSTS` | Domaines autorisés par Django |
| `DJANGO_CORS_ORIGINS` | Origines frontend autorisées |
| `FRONTEND_URL` | URL publique du frontend |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Connexion PostgreSQL |
| `REDIS_URL` | Connexion Redis |
| `EMAIL_*` | Configuration SMTP |
| `COOKIE_SECURE` | Doit être `True` avec HTTPS |
| `WHATSAPP_ENABLED` | Laisser `False` si le service n'est pas utilisé |
| `VITE_API_URL` | URL API utilisée par le frontend |
| `VITE_WS_URL` | URL WebSocket utilisée par le frontend |

## Commandes utiles

### Backend

```powershell
cd "Backend Django/ramaqs_management_app"

# Vérification Django
python manage.py check

# Créer/appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# Tests de recette API
python manage.py test ramaqs_management_plateforme.tests.PreproductionApiTests

# Vérifier qu'aucune migration ne manque
python manage.py makemigrations --check --dry-run
```

### Frontend

```powershell
cd ramaqs-management-app

# Développement
npm run dev

# Tests
npm test

# Lint
npm run lint

# Build de production
npm run build

# Audit des dépendances
npm audit --audit-level=high
```

## Sécurité

- Ne jamais commiter `.env`, tokens JWT, mots de passe ou clés SMTP.
- Ne jamais mettre un token dans une URL, un `console.log` ou un ticket public.
- Les documents sont téléchargés via une route API protégée ; ne pas exposer publiquement `/media/` en production.
- Les fichiers envoyés sont contrôlés par extension, type MIME, signature binaire et taille maximale.
- Les actions sensibles sont contrôlées côté backend selon le rôle et l'appartenance au projet.
- Un consultant peut soumettre une tâche terminée, mais seul un chef de projet ou la direction peut l'approuver.

## Tests et qualité

Le dépôt contient :

- Tests de recette backend dans `ramaqs_management_plateforme/tests.py`.
- Tests frontend Vitest dans `ramaqs-management-app/src/**/*.test.ts`.
- Une recette manuelle dans [TEST_SCENARIOS.md](TEST_SCENARIOS.md).
- Un pipeline CI dans [.github/workflows/ci.yml](.github/workflows/ci.yml) : lint, tests, build, migrations et vérification Django.

Avant toute livraison, les commandes suivantes doivent réussir :

```powershell
# Backend
python manage.py check
python manage.py test ramaqs_management_plateforme.tests.PreproductionApiTests

# Frontend
npm run lint
npm test
npm run build
```

## Structure des dossiers


ramaqs-management-final/
├── Backend Django/
│   └── ramaqs_management_app/
│       ├── ramaqs_management_app/          # Configuration Django / ASGI
│       ├── ramaqs_management_plateforme/   # Modèles, API, permissions, tests
│       ├── requirements.txt
│       └── .env.example
├── ramaqs-management-app/
│   ├── src/
│   │   ├── components/                     # Composants React
│   │   ├── routes/                         # Pages et routes
│   │   ├── store/                          # Redux Toolkit / RTK Query
│   │   ├── hooks/                          # Hooks React
│   │   ├── utils/                          # Utilitaires et tests
│   │   └── config/                         # URLs API/WebSocket
│   ├── package.json
│   └── vite.config.ts
├── .github/workflows/ci.yml                # Validation continue
├── TEST_SCENARIOS.md                       # Recette manuelle
└── README.md
```

## Documentation associée

- [Scénarios de tests manuels](TEST_SCENARIOS.md)
- [Exemple de configuration backend](<Backend%20Django/ramaqs_management_app/.env.example>)
- [Pipeline de validation continue](.github/workflows/ci.yml)
