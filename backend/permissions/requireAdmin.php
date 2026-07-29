<?php

require_once __DIR__ . '/../config/session.php';

header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Non connecté"]);
    exit;
}

if (!isset($_SESSION['role_id']) || $_SESSION['role_id'] != 1) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Action réservée aux administrateurs"]);
    exit;
}
