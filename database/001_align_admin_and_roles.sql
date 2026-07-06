USE explorateur;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  label VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO roles (id, name, label) VALUES
  (1, 'admin', 'Administrateur'),
  (2, 'user', 'Utilisateur')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  label = VALUES(label);

-- Compte de demonstration pour la soutenance :
-- identifiant : admin
-- mot de passe : admin123
INSERT INTO users (username, password, role_id) VALUES
  ('admin', '$2y$10$rLngytsuuGPG08L8UudTm.YYqjhJiBKQZY8Wh7x6kciBav1XmQ4/e', 1)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role_id = VALUES(role_id);
