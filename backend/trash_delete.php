<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/permissions/requireAdmin.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/logger.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$data    = json_decode(file_get_contents('php://input'), true);
$trashId = (int)($data['id'] ?? 0);

if (!$trashId) {
    echo json_encode(['success' => false, 'message' => 'ID invalide']);
    exit;
}

// Récupérer depuis la table trash
try {
    $stmt = $pdo->prepare("SELECT * FROM trash WHERE id = ? LIMIT 1");
    $stmt->execute([$trashId]);
    $item = $stmt->fetch();
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur base de données']);
    exit;
}

if (!$item) {
    echo json_encode(['success' => false, 'message' => 'Élément introuvable']);
    exit;
}

$trashDir = realpath(__DIR__ . '/trash');
$target   = realpath($trashDir . '/' . $item['trash_filename']);

// Sécurité chemin
if ($target && strpos($target, $trashDir) === 0 && file_exists($target)) {
    unlink($target);
}

// Supprimer de la table trash
try {
    $stmt = $pdo->prepare("DELETE FROM trash WHERE id = ?");
    $stmt->execute([$trashId]);
} catch (PDOException $e) {
    error_log('Erreur delete trash DB : ' . $e->getMessage());
}

logAction($_SESSION['user_id'], 'TRASH_DELETE_PERMANENT', $item['original_name']);

echo json_encode(['success' => true, 'message' => 'Supprimé définitivement']);
