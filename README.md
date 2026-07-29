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
cd explorateur
```

**Option B — Via ZIP :**
1. Télécharge et extrais le ZIP
2. Place le dossier dans `C:\xampp\htdocs\`
   - soit sous le nom `explorateur/` (recommandé)
   - soit directement à la racine de `htdocs/` (adapter alors l’URL de l’API — voir plus bas)

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

### 4. Configurer l’URL de l’API (important)

Le frontend ne contient **plus aucun chemin en dur** vers le backend : l’URL est lue dans un fichier JSON, **`frontend/public/config.json`**, chargé au démarrage de la page (pas au moment du build).

**Pourquoi un JSON et pas juste `.env` ?** Un `.env` (`VITE_API_URL`) est figé dans le code au moment de `npm run build`. Le JSON, lui, se modifie **après** le build, directement sur la machine cible, sans rien recompiler : il suffit de recharger la page.

1. Au premier `npm install` / `npm run dev` / `npm run build`, le fichier est **créé automatiquement** (script `scripts/ensure-config.mjs`) à partir de `frontend/public/config.example.json`, avec la valeur XAMPP par défaut. Rien à faire si cette valeur convient déjà.
2. Si ton installation XAMPP est différente, ouvre `frontend/public/config.json` et adapte `api.baseUrl` :

```json
{
  "api": {
    "baseUrl": "http://localhost/explorateur/backend"
  }
}
```

| Situation | Valeur de `api.baseUrl` |
|-----------|--------------------------|
| Dossier `htdocs/explorateur/`, Apache **port 80** (défaut classique) | `http://localhost/explorateur/backend` |
| Dossier à la **racine** de `htdocs/`, Apache **port 8080** | `http://localhost:8080/backend` |
| Racine `htdocs/`, Apache **port 80** | `http://localhost/backend` |
| Dossier `explorateur/`, Apache **port 8080** | `http://localhost:8080/explorateur/backend` |
| Test sur une VM / autre machine du réseau | `http://<IP de la machine>/explorateur/backend` (voir avertissement plus bas sur les sessions) |

> Ce fichier n’est **jamais commité sur Git** (il est dans `.gitignore`, car il dépend de chaque machine). Chaque personne garde sa propre version locale. Il suffit de **recharger la page** après modification — pas besoin de relancer `npm run dev` ni de rebuild.

> `frontend/.env` (`VITE_API_URL`) existe toujours mais n’est plus qu’un **repli** : il n’est utilisé que si `config.json` est introuvable.

### 5. Lancer le frontend

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

### Ports utilisés

| Service | Port par défaut | Où le changer |
|---------|-----------------|---------------|
| **Frontend (Vite)** | `5173` | `frontend/vite.config.js` → `server.port` |
| **Backend (Apache/XAMPP)** | `80` (souvent `8080` selon la machine) | Panneau XAMPP / `httpd.conf` |
| **MySQL** | `3306` | XAMPP |

> Si Apache écoute sur le **port 8080**, l’API n’est **pas** sur `http://localhost/...` mais sur `http://localhost:8080/...`. Il faut alors mettre à jour `api.baseUrl` dans `frontend/public/config.json`.

### 6. Se connecter

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
│   │   ├── session.php           ← Démarrage de session centralisé (cookie SameSite)
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
│   ├── .env.example              ← Modèle de repli (VITE_API_URL), voir config.json
│   ├── .env                      ← Repli, non versionné, local
│   ├── scripts/
│   │   └── ensure-config.mjs     ← Crée public/config.json au 1er dev/build si absent
│   ├── public/
│   │   ├── config.json           ← ★ URL de l'API (non versionné, à éditer localement)
│   │   └── config.example.json   ← Modèle versionné, avec des exemples
│   ├── src/
│   │   ├── config.js             ← Charge public/config.json au runtime
│   │   ├── api/
│   │   │   └── client.js         ← ★ Client API unique (api.login(), api.getFiles()...)
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

## Configuration de l’API (frontend)

Toute l’application React appelle le backend via un **client API unique** : `frontend/src/api/client.js`. Aucun composant n’écrit `fetch("http://...")` ni ne connaît un chemin de route — on appelle par exemple `api.login(user, pass)`, `api.getFiles(path)`, `api.upload(file, path)`, etc. Si une route change côté PHP, c’est le **seul fichier** à corriger.

L’URL de base de l’API, elle, vient d’un seul endroit :

- Fichier : `frontend/public/config.json` (créé automatiquement depuis `config.example.json`, voir étape 4 plus haut)
- Chargé au runtime par `frontend/src/config.js` (une seule fois, avant l’affichage — voir `main.jsx`)
- Repli si absent : `VITE_API_URL` dans `frontend/.env`, puis une valeur par défaut codée en dur

Il n’est **plus nécessaire** de chercher/remplacer `explorateur/` dans les fichiers source, ni de reconstruire le projet : un seul fichier JSON, modifiable même après un `npm run build`, suffit pour adapter le projet à un autre dossier, un autre port Apache, ou une autre machine.

Exemple pour un collègue qui lance Apache sur le port **8080** à la racine de `htdocs` — il édite juste `frontend/public/config.json` :

```json
{ "api": { "baseUrl": "http://localhost:8080/backend" } }
```

et, pour un build de prod, adapte aussi `VITE_BASE` dans `.env` avant de compiler :

```env
VITE_BASE=/
```

> **Page blanche / `Loading failed for the module … /assets/…`**  
> Le `VITE_BASE` du build ne correspond pas à l’URL Apache.  
> Pour ce projet : `VITE_BASE=/explorateur/frontend/dist/` puis `npm run build`.  
> En développement, préfère `npm run dev` → `http://localhost:5173` (pas le dossier `dist/`).

> **Test interplateforme (VM Linux, autre machine du réseau)**  
> Le backend PHP n’a aucun chemin Windows en dur (`__DIR__` est utilisé partout), donc il tourne tel quel sous Linux (XAMPP/LAMP). Point de vigilance si tu testes le frontend et le backend sur des ports différents :
> `config.json` doit pointer vers l’IP/le port réels du backend, pas `localhost`, si tu accèdes depuis une autre machine. La session PHP utilise `SameSite=Lax` (`backend/config/session.php`), ce qui suffit tant que frontend et backend sont sur le **même hôte** (même nom/IP), même à des ports différents — c’est le cas normal ici. `SameSite=None` + HTTPS ne serait utile que si frontend et backend étaient un jour sur deux **noms d’hôte** réellement distincts.

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

## Notifications e-mail (Mailtrap)

Les notifications sont envoyées uniquement lors de la validation d'un compte, d'un changement de rôle ou du blocage d'un compte. Elles vont dans la boîte de test Mailtrap, jamais aux destinataires réels.

1. Exécute `database/002_add_user_email.sql` une fois si la base existe déjà.
2. Copie `.env.example` vers `.env` à la racine, puis renseigne `MAILTRAP_USERNAME` et `MAILTRAP_PASSWORD` depuis ta boîte Mailtrap Sandbox.
3. Redémarre Apache. Si Mailtrap n'est pas configuré ou joignable, l'action d'administration reste appliquée et l'interface l'indique.

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

**❌ Page blanche après connexion / impossible de joindre l’API**
→ Vérifier que XAMPP tourne (Apache + MySQL démarrés)
→ Vérifier `api.baseUrl` dans `frontend/public/config.json` (doit correspondre au dossier **et** au port Apache)
→ Tester dans le navigateur l’URL de ton API + `/me.php`  
  (ex. `http://localhost/explorateur/backend/me.php` ou `http://localhost:8080/backend/me.php`)
→ Recharger simplement la page après modification de `config.json` (pas besoin de relancer `npm run dev`)

**❌ Connexion "réussie" mais aussitôt déconnecté / session qui ne persiste pas**
→ Vérifie que `backend/config/session.php` existe et que `login.php`/`me.php`/`files.php`... passent bien par lui (directement ou via `auth/auth.php`). Le cookie utilise `SameSite=Lax`, ce qui fonctionne tant que frontend et backend sont accédés depuis le **même hôte** (`localhost` des deux côtés, ou la même IP des deux côtés) — ne pas mélanger `localhost` d'un côté et `127.0.0.1`/une IP de l'autre.
→ ⚠️ Ne mets jamais `SameSite=None` sans `Secure` (HTTPS) : Firefox refuse purement et simplement de poser ce cookie, et Chrome ne l'accepte que sur l'hôte exact `localhost` — ça casse complètement la session (déjà vécu sur ce projet, cf. commentaire dans `session.php`).

**❌ "Non connecté" ou erreur sur la prévisualisation**
→ Vérifier que Apache est démarré
→ Vérifier le port Apache (80 ou 8080) et `api.baseUrl` dans `config.json`

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
