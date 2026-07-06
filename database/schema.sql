CREATE DATABASE IF NOT EXISTS explorateur
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE explorateur;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  label VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL DEFAULT 2,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id INT UNSIGNED NULL,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(700) NOT NULL,
  type ENUM('file', 'folder') NOT NULL,
  extension VARCHAR(20) NULL,
  mime_type VARCHAR(120) NULL,
  size BIGINT UNSIGNED NULL,
  checksum CHAR(64) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_files_path_name (path, name),
  KEY idx_files_search (name, extension, type),
  KEY idx_files_deleted (is_deleted, deleted_at),
  CONSTRAINT fk_files_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id INT UNSIGNED NOT NULL,
  version_path VARCHAR(900) NOT NULL,
  size BIGINT UNSIGNED NULL,
  checksum CHAR(64) NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_versions_file_created (file_id, created_at),
  CONSTRAINT fk_versions_file
    FOREIGN KEY (file_id) REFERENCES files(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_versions_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historique (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  file_path VARCHAR(900) NOT NULL,
  target_user INT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_historique_created (created_at),
  KEY idx_historique_user (user_id, created_at),
  CONSTRAINT fk_historique_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_historique_target_user
    FOREIGN KEY (target_user) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS file_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  can_read TINYINT(1) NOT NULL DEFAULT 1,
  can_write TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_file_permissions (file_id, user_id),
  CONSTRAINT fk_file_permissions_file
    FOREIGN KEY (file_id) REFERENCES files(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_file_permissions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO roles (id, name, label) VALUES
  (1, 'admin', 'Administrateur'),
  (2, 'user', 'Utilisateur')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  label = VALUES(label);

-- Mot de passe de demonstration : admin123
INSERT INTO users (username, password, role_id) VALUES
  ('admin', '$2y$10$rLngytsuuGPG08L8UudTm.YYqjhJiBKQZY8Wh7x6kciBav1XmQ4/e', 1)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role_id = VALUES(role_id);
