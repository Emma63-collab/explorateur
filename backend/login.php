<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';

$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if ($username === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur ou mot de passe manquant']);
    exit;
}

$result = login($username, $password);

if ($result === false) {
    // Message générique volontaire : ne pas préciser si c'est le login ou le mdp qui est faux
    echo json_encode(['success' => false, 'message' => 'Identifiants incorrects']);
    exit;
}

if ($result === 'pending') {
    echo json_encode(['success' => false, 'pending' => true, 'message' => 'Votre compte est en attente de validation par un administrateur']);
    exit;
}

if ($result === 'blocked') {
    echo json_encode(['success' => false, 'blocked' => true, 'message' => 'Votre compte a été bloqué. Contactez un administrateur.']);
    exit;
}

$role = roleName((int)$result['role_id']);

echo json_encode([
    'success'  => true,
    'message'  => 'Connexion réussie',
    'role'     => $role,
    'username' => $result['username'],
]);
