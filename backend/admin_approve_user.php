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

// Correspondance nom de rôle → role_id
$roleMap = ['admin' => 1, 'editeur' => 3, 'lecteur' => 2, 'user' => 2];

$sets  = [];
$binds = [];

// Changement de statut (active / blocked / pending)
if (isset($data['status'])) {
    $status = in_array($data['status'], ['pending','active','blocked']) ? $data['status'] : 'active';
    $sets[]  = "status = ?";
    $binds[] = $status;
}

// Changement de rôle
if (isset($data['role'])) {
    $roleName = $data['role'];
    if (!array_key_exists($roleName, $roleMap)) {
        echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
        exit;
    }
    $sets[]  = "role_id = ?";
    $binds[] = $roleMap[$roleName];
}

if (empty($sets)) {
    echo json_encode(['success' => false, 'message' => 'Rien à modifier']);
    exit;
}

$binds[] = $id;
$sql     = "UPDATE users SET " . implode(', ', $sets) . " WHERE id = ?";
$stmt    = $pdo->prepare($sql);

if ($stmt->execute($binds)) {
    // Journaliser l'action
    $currentUser = $_SESSION['user_id'] ?? null;
    if ($currentUser) {
        $action = isset($data['status']) ? 'Modification statut utilisateur' : 'Modification rôle utilisateur';
        $log = $pdo->prepare(
            "INSERT INTO historique (user_id, action, file_path) VALUES (?, ?, ?)"
        );
        $log->execute([$currentUser, $action, "user_id:$id"]);
    }

    echo json_encode(['success' => true, 'message' => 'Utilisateur mis à jour']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
}
