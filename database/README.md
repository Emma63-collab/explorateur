# Base de données du projet Explorateur

Ce dossier contient le schéma SQL du projet et une migration légère pour aligner une base existante.

## Fichiers

- `schema.sql` : installation complète de la base `explorateur` (8 tables).
- `001_align_admin_and_roles.sql` : migration légère pour les anciennes bases (obsolète si vous importez `schema.sql`).

## Compte de démonstration

- Identifiant : `admin`
- Mot de passe : `admin123`
- Rôle : administrateur

## Tables

| Table | Rôle |
|-------|------|
| `roles` | Profils applicatifs : admin (1), user/lecteur (2), editeur (3) |
| `users` | Comptes, mots de passe hashés (bcrypt), statut et rôle |
| `files` | Index métier des fichiers et dossiers (stockage physique dans `backend/uploads/`) |
| `versions` | Historique des versions d'un fichier (fichiers dans `backend/versions/`) |
| `historique` | Journal des actions (upload, suppression, renommage, admin…) |
| `file_permissions` | Droits fins par utilisateur et par fichier |
| `trash` | Corbeille : métadonnées des éléments supprimés (fichiers dans `backend/trash/`) |
| `sessions` | Tokens de session (présente en base ; l'app utilise les sessions PHP natives) |

## Note sur les rôles

En base, le rôle id=2 s'appelle `user`. L'interface et le backend PHP l'affichent comme **lecteur** (`auth.php`, panneau admin).
