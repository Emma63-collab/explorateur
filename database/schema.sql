-- ============================================================
--  EMM'S Files — Schéma de base de données
--  Exporté depuis la base MySQL/MariaDB « explorateur » (XAMPP)
--  Compatible MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

CREATE DATABASE IF NOT EXISTS explorateur
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE explorateur;

-- ── 1. RÔLES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(30)      NOT NULL,
  label      VARCHAR(80)      NOT NULL,
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Rôles : admin (1), user/lecteur (2), editeur (3)
-- Note : le rôle id=2 s'appelle « user » en base ; l'application l'affiche « lecteur ».
INSERT INTO roles (id, name, label) VALUES
  (1, 'admin',   'Administrateur'),
  (2, 'user',    'Utilisateur'),
  (3, 'editeur', 'Éditeur')
ON DUPLICATE KEY UPDATE
  name  = VALUES(name),
  label = VALUES(label);

-- ── 2. UTILISATEURS ─────────────────────────────────────────
-- status :
--   pending = compte créé, en attente de validation par l'admin
--   active  = compte validé, connexion autorisée
--   blocked = compte bloqué, connexion refusée
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)      NOT NULL,
  email      VARCHAR(254)     NOT NULL,
  password   VARCHAR(255)     NOT NULL,
  role_id    TINYINT          NOT NULL DEFAULT 2,
  status     ENUM('pending','active','blocked') NOT NULL DEFAULT 'active',
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- Compte admin par défaut — identifiant : admin / mot de passe : admin123
INSERT INTO users (username, email, password, role_id, status) VALUES
  ('admin', 'admin@example.test', '$2y$10$rLngytsuuGPG08L8UudTm.YYqjhJiBKQZY8Wh7x6kciBav1XmQ4/e', 1, 'active')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password = VALUES(password),
  role_id  = VALUES(role_id),
  status   = VALUES(status);

-- ── 3. HISTORIQUE DES ACTIONS ───────────────────────────────
CREATE TABLE IF NOT EXISTS historique (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  action      VARCHAR(100)  NOT NULL,
  file_path   VARCHAR(1000)          DEFAULT NULL,
  target_user INT UNSIGNED           DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_id    (user_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ── 4. FICHIERS (métadonnées) ───────────────────────────────
-- Le stockage physique est dans backend/uploads/
CREATE TABLE IF NOT EXISTS files (
  id         INT UNSIGNED                NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255)                NOT NULL,
  path       VARCHAR(1000)               NOT NULL,
  type       ENUM('file','folder')       NOT NULL DEFAULT 'file',
  mime_type  VARCHAR(100)                         DEFAULT NULL,
  size       BIGINT                                 DEFAULT NULL,
  user_id    INT UNSIGNED                NOT NULL,
  created_at DATETIME                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_name_path (name, path(255)),
  KEY idx_user_id   (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ── 5. VERSIONS DE FICHIERS ───────────────────────────────────
-- Les fichiers de version sont stockés dans backend/versions/
CREATE TABLE IF NOT EXISTS versions (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  file_id      INT UNSIGNED NOT NULL,
  version_path VARCHAR(500) NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_file_id (file_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ── 6. PERMISSIONS FICHIERS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS file_permissions (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  file_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  can_read   TINYINT(1)   NOT NULL DEFAULT 1,
  can_write  TINYINT(1)   NOT NULL DEFAULT 0,
  can_delete TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_file_id (file_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ── 7. CORBEILLE ──────────────────────────────────────────────
-- Les fichiers supprimés sont déplacés dans backend/trash/
CREATE TABLE IF NOT EXISTS trash (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  original_name  VARCHAR(255) NOT NULL,
  original_path  VARCHAR(1000) NOT NULL,
  trash_filename VARCHAR(255) NOT NULL,
  deleted_by     INT UNSIGNED NOT NULL,
  deleted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restored       TINYINT(1)   NOT NULL DEFAULT 0,
  restored_at    DATETIME              DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_deleted_by (deleted_by)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ── 8. SESSIONS (table optionnelle) ───────────────────────────
-- Présente en base ; l'application utilise les sessions PHP natives (auth.php).
CREATE TABLE IF NOT EXISTS sessions (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(128) NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)           DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY token (token),
  KEY idx_token   (token),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ============================================================
--  RÉSUMÉ
--  Tables créées (8) :
--    roles            — profils (admin / user / editeur)
--    users            — comptes avec statut pending/active/blocked
--    historique       — journal d'actions
--    files            — métadonnées fichiers et dossiers
--    versions         — anciennes versions de fichiers
--    file_permissions — droits par fichier et par utilisateur
--    trash            — corbeille (restauration / suppression définitive)
--    sessions         — tokens de session (non utilisée par le code actuel)
--
--  Compte par défaut :
--    login    : admin
--    password : admin123
-- ============================================================
