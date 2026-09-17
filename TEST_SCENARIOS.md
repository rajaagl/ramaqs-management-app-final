# Recette manuelle RAMAQS

Utiliser cinq comptes approuvés : direction, chef de projet, consultant, client et partenaire. Cocher chaque ligne après vérification.

## Inscription

| Statut | ID | Action | Résultat attendu |
|---|---|---|---|
| ☐ | INS-01 | Inscrire un consultant avec mot de passe fort. | Compte `pending`, connexion refusée avant approbation. |
| ☐ | INS-02 | Inscrire à nouveau le même email. | Refus et aucun doublon. |
| ☐ | INS-03 | Utiliser `123456` comme mot de passe. | Refus. |
| ☐ | INS-04 | Forcer le rôle `direction` dans la requête. | Refus. |
| ☐ | INS-05 | Direction approuve/refuse le compte. | Approbation : connexion possible ; refus : connexion impossible. |

## Connexion et JWT

| Statut | ID | Action | Résultat attendu |
|---|---|---|---|
| ☐ | AUTH-01 | Se connecter avec un compte approuvé. | JWT reçu et redirection adaptée au rôle. |
| ☐ | AUTH-02 | Saisir un mauvais mot de passe. | Refus sans divulguer de données sensibles. |
| ☐ | AUTH-03 | Se connecter avec un compte `pending`, refusé ou inactif. | Refus. |
| ☐ | AUTH-04 | Appeler `/api/projets/` sans JWT. | HTTP `401`. |
| ☐ | AUTH-05 | Utiliser un endpoint direction avec un consultant. | HTTP `403` ou liste vide. |
| ☐ | AUTH-06 | Attendre l'expiration du JWT puis naviguer. | Refresh automatique ou déconnexion propre. |
| ☐ | AUTH-07 | Cliquer Déconnexion. | Tokens supprimés et refresh token invalidé. |

## Mot de passe oublié

| Statut | ID | Action | Résultat attendu |
|---|---|---|---|
| ☐ | PWD-01 | Demander un reset avec email/téléphone valides. | Message neutre et lien email. |
| ☐ | PWD-02 | Demander un reset pour un compte inconnu. | Même message neutre. |
| ☐ | PWD-03 | Utiliser le lien et un mot de passe fort. | Mot de passe modifié et connexion possible. |
| ☐ | PWD-04 | Réutiliser ou expirer le lien. | Refus. |
| ☐ | PWD-05 | Essayer l'ancien mot de passe après reset. | Connexion refusée. |

## Projets et tâches

| Statut | ID | Action | Résultat attendu |
|---|---|---|---|
| ☐ | PRJ-01 | Direction crée un projet valide. | Projet créé. |
| ☐ | PRJ-02 | Créer avec fin avant début ou budget négatif. | Refus. |
| ☐ | PRJ-03 | Consultant crée/modifie un projet. | HTTP `403`. |
| ☐ | PRJ-04 | Chaque rôle affiche les projets. | Il ne voit que ses projets autorisés. |
| ☐ | TSK-01 | Direction/chef crée une tâche assignée. | Tâche créée. |
| ☐ | TSK-02 | Consultant crée une tâche ou modifie celle d'un autre. | HTTP `403`/`404`. |
| ☐ | TSK-03 | Consultant met sa tâche à 100 %. | Statut `en_attente_validation`. |
| ☐ | TSK-04 | Consultant force `termine`. | HTTP `403`. |
| ☐ | TSK-05 | Chef/direction approuve puis rejette une tâche en attente. | Terminé avec date réelle ; ou retour `en_cours`. |
| ☐ | TSK-06 | Mettre avancement `-10` ou `120`. | Refus. |

## Documents et notifications

| Statut | ID | Action | Résultat attendu |
|---|---|---|---|
| ☐ | DOC-01 | Envoyer un PDF, JPG ou PNG valide de moins de 10 Mo. | Document créé sur un projet autorisé. |
| ☐ | DOC-02 | Envoyer un `.exe`, faux PDF ou fichier de plus de 10 Mo. | Refus. |
| ☐ | DOC-03 | Consultant envoie/déplace un document sur un autre projet. | HTTP `403`. |
| ☐ | DOC-04 | Membre autorisé télécharge un document. | Téléchargement réussi. |
| ☐ | DOC-05 | Utilisateur extérieur utilise l'URL du document. | HTTP `404` ou `403`. |
| ☐ | NTF-01 | Déclencher une notification pour un consultant. | Seul le destinataire la voit. |
| ☐ | NTF-02 | Marquer une notification comme lue puis actualiser. | État conservé. |
| ☐ | NTF-03 | Tester WebSocket avec compte actif/inactif. | Actif : notification reçue ; inactif : accès refusé. |

## Commandes avant livraison

```powershell
# Backend Django
python manage.py check
python manage.py test ramaqs_management_plateforme.tests.PreproductionApiTests
python manage.py makemigrations --check --dry-run

# Frontend React
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

## Bilan

- Date :
- Version :
- Environnement : local / préproduction
- Testeur :
- Scénarios réussis :
- Scénarios échoués :
- Anomalies :
- Décision : `GO` / `NO GO`
