<?php

$host = "localhost";
$dbname = "explorateur"; // 👈 TON NOM DE BASE
$user = "root";
$pass = ""; // XAMPP = vide par défaut

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $user,
        $pass
    );

    // 🔥 important pour voir les erreurs
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    die("Erreur connexion DB: " . $e->getMessage());
}