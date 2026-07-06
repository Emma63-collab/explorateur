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

$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
$role     = $data['role'] ?? 'lecteur';

// Validation
if ($username === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur et mot de passe requis']);
    exit;
}

if (strlen($username) < 3 || strlen($username) > 50) {
    echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur : 3 à 50 caractères']);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Mot de passe trop court (8 caractères minimum)']);
    exit;
}

// Correspondance rôle → role_id
$roleMap = ['admin' => 1, 'editeur' => 3, 'lecteur' => 2, 'user' => 2];
if (!array_key_exists($role, $roleMap)) {
    echo json_encode(['success' => false, 'message' => 'Rôle invalide']);
    exit;
}
$role_id = $roleMap[$role];

// Vérifier unicité
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Ce nom d\'utilisateur est déjà pris']);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

// Créé par l'admin → directement actif
$stmt = $pdo->prepare(
    "INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, 'active')"
);

if ($stmt->execute([$username, $hashed, $role_id])) {
    $newId = $pdo->lastInsertId();

    // Journaliser
    $currentUser = $_SESSION['user_id'] ?? null;
    if ($currentUser) {
        $log = $pdo->prepare(
            "INSERT INTO historique (user_id, action, file_path) VALUES (?, ?, ?)"
        );
        $log->execute([$currentUser, 'Création compte utilisateur', "username:$username"]);
    }

    echo json_encode(['success' => true, 'message' => 'Compte créé', 'id' => $newId]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
}
