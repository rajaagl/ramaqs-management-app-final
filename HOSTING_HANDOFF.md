# Livraison pour l'hébergement

Ce dépôt est prêt à être repris par l'équipe d'hébergement. Les secrets et les
adresses de production ne sont volontairement pas inclus dans le code.

## 1. Préparer les variables d'environnement

Copier `Backend Django/ramaqs_management_app/.env.example` vers `.env`, puis
renseigner les valeurs réelles : base PostgreSQL, Redis, SMTP, noms de domaine
et `DJANGO_SECRET_KEY` fort.

En production, les valeurs minimales suivantes sont impératives :

```env
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com,https://api.example.com
FRONTEND_URL=https://app.example.com
```

Ne jamais versionner ce fichier `.env` ni les mots de passe, clés SMTP, JWT ou
identifiants PostgreSQL/Redis.

## 2. Déployer le backend Django

Depuis `Backend Django/ramaqs_management_app` :

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy
```

Lancer ensuite l'ASGI avec Daphne ou un serveur équivalent derrière le proxy
HTTPS. Configurer le proxy pour transmettre les requêtes `/api/` et `/ws/` au
backend, ainsi que les en-têtes `Host` et `X-Forwarded-Proto`.

Les migrations `0021_remove_projet_priorite.py` et
`0022_projet_domaine_multiple.py` font partie de la livraison : vérifier
qu'elles sont bien commitées avant d'exécuter `migrate`.

## 3. Déployer le frontend

Depuis `ramaqs-management-app` :

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Publier le contenu de `dist/` sur le domaine frontend. Définir au build la
variable `VITE_API_URL` avec l'URL HTTPS publique de l'API, par exemple
`https://api.example.com/api`.

## 4. Services requis

- PostgreSQL sauvegardé et accessible uniquement par le backend.
- Redis disponible pour Channels/WebSockets si cette fonctionnalité est
  activée.
- SMTP réel configuré et testé pour approbation des comptes et réinitialisation
  des mots de passe.
- Certificat HTTPS valide, redirection HTTP vers HTTPS et proxy configuré.

## 5. Contrôles avant ouverture au public

- Vérifier l'inscription, l'approbation/rejet, la connexion JWT et la
  réinitialisation du mot de passe avec un compte de recette.
- Vérifier l'accès interdit sans JWT aux documents et aux API privées.
- Vérifier le téléchargement de document avec un JWT valide.
- Vérifier l'envoi SMTP, Redis et la persistance PostgreSQL réels.
- Exécuter `python manage.py check --deploy` avec les vraies variables.

Les modules Finance/KPI/Ressources inachevés sont volontairement retirés de
l'API publique (réponse 404) et ne doivent pas être exposés avant leur recette
complète.
