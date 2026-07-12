# EMM'S Files — Gestionnaire de Fichiers Web

> Application web de gestion documentaire sécurisée avec système de rôles.
> Développée par **BOCCO Anne-Rosine** dans le cadre d'un BTS Développement d'Applications — ESA Lomé.

**Stack technique :** React.js · PHP · MySQL · XAMPP

---

## ⚡ Installation rapide (5 étapes)

### 1. Prérequis

Installe ces outils si ce n'est pas déjà fait :

| Outil | Version min | Téléchargement |
|-------|-------------|----------------|
| XAMPP | 8.x | https://www.apachefriends.org |
| Node.js | 18+ | https://nodejs.org |
| Git | any | https://git-scm.com |

---

### 2. Récupérer le projet

**Option A — Via Git :**
```bash
git clone https://github.com/Emma63-collab/explorateur.git
cd emms-files
```

**Option B — Via ZIP :**
1. Télécharge et extrais le ZIP
2. Place le dossier `explorateur/` dans `C:\xampp\htdocs\`

---

### 3. Créer la base de données

> ⚠️ **Faire cette étape AVANT de lancer le frontend**

1. Lance **XAMPP** → démarre **Apache** et **MySQL**
2. Ouvre `http://localhost/phpmyadmin`
3. Clique sur l'onglet **SQL** (barre du haut)
4. Ouvre le fichier `database/schema.sql` avec un éditeur texte
5. Copie tout son contenu et colle-le dans la zone SQL de phpMyAdmin
6. Clique **Exécuter**

✅ Cela crée automatiquement :
- La base de données `explorateur`
- Les 8 tables : `roles`, `users`, `historique`, `files`, `versions`, `file_permissions`, `trash`, `sessions`
- Le compte administrateur par défaut

---

### 4. Lancer le frontend

Ouvre un terminal dans le dossier `frontend/` :

```bash
cd explorateur/frontend
npm install
npm run dev
```

Tu verras :
```
VITE ready
➜ Local: http://localhost:5173/
```

---

### 5. Se connecter

Ouvre `http://localhost:5173` dans ton navigateur.

**Compte administrateur par défaut :**

```
Identifiant : admin
Mot de passe : admin123
```

> ⚠️ Change ce mot de passe après la première connexion via le panneau admin.

---

## Structure du projet

```
explorateur/
│
├── 📁 backend/                   ← API PHP (servi par Apache/XAMPP)
│   ├── auth/auth.php             ← Authentification & sessions
│   ├── config/
│   │   ├── database.php          ← Connexion MySQL (à modifier si besoin)
│   │   └── cors.php              ← Headers CORS
│   ├── permissions/
│   │   ├── requireLogin.php      ← Vérifie la connexion
│   │   ├── requireEditeur.php    ← Réservé éditeur + admin
│   │   └── requireAdmin.php      ← Réservé admin uniquement
│   ├── uploads/                  ← Dossier des fichiers uploadés
│   ├── login.php
│   ├── register.php
│   ├── me.php
│   ├── logout.php
│   ├── files.php
│   ├── upload.php
│   ├── download.php
│   ├── preview.php
│   ├── delete.php
│   ├── rename.php
│   ├── paste.php
│   ├── search.php
│   ├── dashboard.php
│   ├── versions.php
│   ├── trash_*.php               ← Corbeille (liste, restauration, suppression)
│   ├── logs.php                  ← Journal d'activité (admin)
│   └── admin_*.php
│
├── 📁 frontend/                  ← Interface React.js (port 5173)
│   ├── src/
│   │   ├── App.jsx               ← Explorateur principal
│   │   ├── App.css               ← Styles + thème sombre
│   │   ├── icons.jsx             ← Bibliothèque d'icônes SVG
│   │   └── pages/
│   │       ├── AuthPage.jsx      ← Connexion / Inscription
│   │       ├── AuthPage.css
│   │       ├── Dashboard.jsx     ← Tableau de bord d'accueil
│   │       ├── AdminPanel.jsx    ← Panneau administrateur
│   │       └── AdminLogs.jsx     ← Journal d'activité (admin)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── 📁 database/
    └── schema.sql                ← ⭐ Script SQL à importer en premier
```

---

## Configuration de la base de données

Par défaut, la connexion lit les variables d'environnement (ou leurs valeurs par défaut XAMPP) dans **`backend/config/database.php`** :

| Variable | Défaut XAMPP |
|----------|--------------|
| `DB_HOST` | `localhost` |
| `DB_NAME` | `explorateur` |
| `DB_USER` | `root` |
| `DB_PASS` | *(vide)* |

Tu peux les définir dans un fichier `.env` à la racine du projet, ou modifier directement les valeurs par défaut dans `database.php`.

---

## Système de rôles

| Rôle | Voir fichiers | Télécharger | Uploader | Modifier | Supprimer | Admin panel |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Éditeur** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Lecteur** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Créer un utilisateur :**
1. L'utilisateur s'inscrit via la page de connexion
2. Son compte passe en statut **"en attente"** (`pending`)
3. L'admin le valide et lui attribue un rôle depuis le **panneau Administration**

> En base, le rôle lecteur est enregistré sous le nom `user` (id=2). L'application l'affiche toujours comme **Lecteur**.

---

## Fonctionnalités

- 🔐 Authentification sécurisée (sessions PHP, mots de passe hashés bcrypt)
- 👥 3 niveaux de rôles avec validation admin
- 📁 Explorateur de fichiers (vue liste + vue grille)
- ⬆️ Upload par clic ou glisser-déposer (dossiers entiers supportés)
- 👁️ Prévisualisation intégrée : images, PDF, vidéo, audio, texte
- ⬇️ Téléchargement de fichiers
- 🗑️ Corbeille avec restauration
- 📋 Copier / Couper / Coller entre dossiers
- ✏️ Renommage inline
- 🕒 Versioning (restauration d'anciennes versions)
- 🔍 Recherche locale et globale
- ⌨️ Raccourcis clavier (Ctrl+C, Ctrl+V, F2, Suppr, Échap...)
- 🌙 Thème sombre / clair (persisté)
- 📊 Dashboard avec statistiques et activité récente
- 📜 Journal d'activité complet (admin)

---

## Résolution des problèmes

**❌ Page blanche après connexion**
→ Vérifier que XAMPP tourne (Apache + MySQL démarrés)
→ Vérifier que le dossier est dans `C:\xampp\htdocs\explorateur\`

**❌ "Non connecté" ou erreur sur la prévisualisation**
→ Vérifier que Apache est démarré
→ Tester `http://localhost/explorateur/backend/me.php` dans le navigateur

**❌ Erreur lors de l'import SQL (limite d'index)**
→ Utiliser uniquement `database/schema.sql` (les anciens fichiers sont obsolètes)
→ Ne pas importer d'autres fichiers `.sql` du projet

**❌ Impossible de se connecter avec admin/admin123**
→ Vérifier que la table `users` contient bien une colonne `status`
→ Si la colonne manque, exécuter ceci dans phpMyAdmin :
```sql
ALTER TABLE users ADD COLUMN status ENUM('pending','active','blocked') NOT NULL DEFAULT 'active' AFTER role_id;
UPDATE users SET status = 'active' WHERE role_id = 1;
```

**❌ Upload ne fonctionne pas**
→ Créer manuellement le dossier `backend/uploads/` s'il n'existe pas
→ Vérifier que Apache a les droits d'écriture sur ce dossier

**❌ Le frontend ne démarre pas**
→ Vérifier que Node.js v18+ est installé : `node --version`
→ Supprimer `node_modules/` et refaire `npm install`

---

## Auteure

**BOCCO Anne-Rosine**
BTS Développement d'Applications · École Supérieure des Affaires (ESA) · Lomé, Togo
📧 boccoemmanuella52@gmail.com

---

*EMM'S Files — Tous droits réservés © 2025*
