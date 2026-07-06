<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';

/* ==========================
   CORS
========================== */

/* ==========================
   AUTH
========================== */
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode([]);
    exit;
}

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode([]);
    exit;
}

/* ==========================
   LECTURE HISTORIQUE DB
========================== */
$stmt = $pdo->query("
    SELECT
        h.created_at AS date,
        COALESCE(u.username, CONCAT('Utilisateur #', h.user_id)) AS user,
        h.action,
        h.file_path AS target
    FROM historique h
    LEFT JOIN users u ON u.id = h.user_id
    ORDER BY h.created_at DESC
    LIMIT 300
");

echo json_encode($stmt->fetchAll());
