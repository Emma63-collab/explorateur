<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$file = $data['file'] ?? '';
$path = $data['path'] ?? '';

if ($file === '') {
    echo json_encode(['success' => false, 'message' => 'Nom de fichier manquant']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT v.id, v.version_path, v.created_at
    FROM versions v
    JOIN files f ON v.file_id = f.id
    WHERE f.name = ? AND f.path = ?
    ORDER BY v.created_at DESC
");
$stmt->execute([$file, $path]);
$versions = $stmt->fetchAll();

echo json_encode([
    'success'  => true,
    'versions' => $versions,
]);
