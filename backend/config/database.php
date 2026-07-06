<?php
/*
 * Connexion base de données — PDO unique
 * Les credentials sont lus depuis les variables d'environnement.
 * En local XAMPP, définir dans .env ou passer les valeurs directement ici.
 *
 * Variables attendues :
 *   DB_HOST     (défaut : localhost)
 *   DB_NAME     (défaut : explorateur)
 *   DB_USER     (défaut : root)
 *   DB_PASS     (défaut : "")
 */

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'explorateur';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion base de données']);
    exit;
}
