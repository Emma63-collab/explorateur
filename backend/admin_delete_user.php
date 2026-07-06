<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès réservé aux administrateurs']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id   = (int)($data['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID utilisateur invalide']);
    exit;
}

// Empêcher l'admin de se supprimer lui-même
if ($id === (int)($_SESSION['user_id'] ?? 0)) {
    echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas supprimer votre propre compte']);
    exit;
}

// Empêcher de supprimer le dernier admin
$stmt = $pdo->prepare("SELECT role_id FROM users WHERE id = ?");
$stmt->execute([$id]);
$target = $stmt->fetch();

if (!$target) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
    exit;
}

if ((int)$target['role_id'] === 1) {
    $adminCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role_id = 1")->fetchColumn();
    if ($adminCount <= 1) {
        echo json_encode(['success' => false, 'message' => 'Impossible de supprimer le dernier administrateur']);
        exit;
    }
}

$stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");

if ($stmt->execute([$id])) {
    $currentUser = $_SESSION['user_id'] ?? null;
    if ($currentUser) {
        $log = $pdo->prepare("INSERT INTO historique (user_id, action, file_path) VALUES (?, ?, ?)");
        $log->execute([$currentUser, 'Suppression compte utilisateur', "user_id:$id"]);
    }
    echo json_encode(['success' => true, 'message' => 'Compte supprimé']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
}
