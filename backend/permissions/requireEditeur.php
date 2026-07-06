<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Non connecté"]);
    exit;
}

// role_id 1 = admin, 3 = editeur
$roleId = (int)($_SESSION['role_id'] ?? 0);
if (!in_array($roleId, [1, 3], true)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Action réservée aux éditeurs et administrateurs"]);
    exit;
}
