<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/permissions/fileAccess.php';
require_once __DIR__ . '/utils/logger.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Connexion requise']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $data['action'] ?? 'list';
$path = trim((string)($data['path'] ?? ''), '/');

if ($path === '' || str_contains($path, '..') || !canManageFileSharing($path)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Seul le propriétaire ou un administrateur peut gérer ce partage']);
    exit;
}

$file = getFileRecord($path);
if (!$file) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ce fichier doit être importé dans l’application avant d’être partagé']);
    exit;
}
$fileId = (int)$file['id'];

if ($action === 'list') {
    $users = $pdo->prepare("SELECT id, username, email FROM users WHERE status = 'active' AND id != ? ORDER BY username");
    $users->execute([(int)$_SESSION['user_id']]);
    $shares = $pdo->prepare('SELECT fp.user_id, fp.can_read, fp.can_write, u.username, u.email FROM file_permissions fp JOIN users u ON u.id = fp.user_id WHERE fp.file_id = ? AND fp.user_id != ? ORDER BY u.username');
    $shares->execute([$fileId, (int)$file['user_id']]);
    echo json_encode(['success' => true, 'users' => $users->fetchAll(), 'shares' => $shares->fetchAll()]);
    exit;
}

$userId = (int)($data['user_id'] ?? 0);
if ($userId <= 0 || $userId === (int)$file['user_id']) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur invalide']);
    exit;
}

if ($action === 'set') {
    $access = $data['access'] ?? 'read';
    if (!in_array($access, ['read', 'write'], true)) {
        echo json_encode(['success' => false, 'message' => 'Droit invalide']);
        exit;
    }
    $user = $pdo->prepare("SELECT id FROM users WHERE id = ? AND status = 'active' LIMIT 1");
    $user->execute([$userId]);
    if (!$user->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable ou inactif']);
        exit;
    }
    $update = $pdo->prepare('UPDATE file_permissions SET can_read = 1, can_write = ?, can_delete = 0 WHERE file_id = ? AND user_id = ?');
    $update->execute([$access === 'write' ? 1 : 0, $fileId, $userId]);
    if ($update->rowCount() === 0) {
        $insert = $pdo->prepare('INSERT INTO file_permissions (file_id, user_id, can_read, can_write, can_delete) VALUES (?, ?, 1, ?, 0)');
        $insert->execute([$fileId, $userId, $access === 'write' ? 1 : 0]);
    }
    logAction((int)$_SESSION['user_id'], 'share', $path);
    echo json_encode(['success' => true, 'message' => 'Accès mis à jour']);
    exit;
}

if ($action === 'remove') {
    $remove = $pdo->prepare('DELETE FROM file_permissions WHERE file_id = ? AND user_id = ?');
    $remove->execute([$fileId, $userId]);
    logAction((int)$_SESSION['user_id'], 'unshare', $path);
    echo json_encode(['success' => true, 'message' => 'Accès retiré']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Action inconnue']);
