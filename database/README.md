# Base de donnees du projet Explorateur

Ce dossier contient le modele SQL du projet et les migrations utiles pour aligner une base XAMPP existante.

## Fichiers

- `schema.sql` : installation complete de la base `explorateur`.
- `001_align_admin_and_roles.sql` : migration legere pour ajouter les roles et reinitialiser le compte de demonstration.

## Compte de demonstration

- Identifiant : `admin`
- Mot de passe : `admin123`
- Role : administrateur

## Tables importantes

`roles`
: Liste les profils applicatifs. Pour la soutenance, elle permet d'expliquer la separation entre administrateur et utilisateur simple.

`users`
: Stocke les comptes, les mots de passe hashes et le role de chaque utilisateur.

`files`
: Index metier des fichiers et dossiers geres par l'application. Le stockage physique reste dans `backend/uploads`, mais la table permet la recherche, les droits, les statistiques et l'audit.

`versions`
: Historique des anciennes versions d'un fichier. C'est utile pour justifier la restauration et la tracabilite.

`historique`
: Journal des actions : creation, suppression, renommage, upload, restauration, etc. C'est une table essentielle pour montrer que l'application est administrable.

`file_permissions`
: Droits fins par utilisateur et par fichier. Meme si toute l'interface n'exploite pas encore cette table, elle donne une base solide pour faire evoluer le projet vers le partage securise.

## Ce que le jury doit comprendre

Le projet ne se limite pas a afficher un dossier du serveur. Il pose les bases d'une vraie GED simple :

- authentification et roles ;
- gestion de fichiers et dossiers ;
- corbeille et restauration ;
- versions ;
- historique d'administration ;
- permissions fines preparant le partage documentaire.
