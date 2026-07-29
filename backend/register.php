<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if ($username === '' || $email === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Champs manquants']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    echo json_encode(['success' => false, 'message' => 'Adresse e-mail invalide']);
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

// Vérifier si le nom existe déjà
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
$stmt->execute([$username, $email]);

if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Ce nom d\'utilisateur ou cette adresse e-mail est déjà utilisé']);
    exit;
}

$hashed  = password_hash($password, PASSWORD_DEFAULT);
$role_id = 2; // lecteur/user par défaut

// Le compte est créé en "pending" — l'admin doit valider
$stmt = $pdo->prepare(
    "INSERT INTO users (username, email, password, role_id, status) VALUES (?, ?, ?, ?, 'pending')"
);

if ($stmt->execute([$username, $email, $hashed, $role_id])) {
    echo json_encode([
        'success' => true,
        'pending' => true,
        'message' => 'Compte créé — en attente de validation par un administrateur'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du compte']);
}
