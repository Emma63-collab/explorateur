<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "connected" => false]);
    exit;
}

$role = roleName((int)($_SESSION['role_id'] ?? 2));

echo json_encode([
    "success"   => true,
    "connected" => true,
    "user_id"   => $_SESSION['user_id'],
    "role"      => $role,
    "username"  => $_SESSION['username'] ?? ''
]);
