-- À exécuter une fois sur une base existante avant d'activer les notifications e-mail.
ALTER TABLE users ADD COLUMN email VARCHAR(254) NULL AFTER username;
UPDATE users SET email = CONCAT(username, '@example.test') WHERE email IS NULL OR email = '';
ALTER TABLE users MODIFY email VARCHAR(254) NOT NULL;
ALTER TABLE users ADD UNIQUE KEY email (email);
