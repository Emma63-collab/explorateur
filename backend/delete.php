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

$data = json_decode(file_get_contents('php://input'), true);
$file = $data['file'] ?? '';
$path = $data['path'] ?? '.';

$baseDir  = realpath(__DIR__ . '/uploads');
$trashDir = __DIR__ . '/trash';

if (!is_dir($trashDir)) mkdir($trashDir, 0755, true);
$trashDir = realpath($trashDir);

$targetFile = realpath($baseDir . '/' . $path . '/' . $file);

if (!$targetFile || strpos($targetFile, $baseDir) !== 0) {
    echo json_encode(['success' => false, 'message' => 'Fichier invalide']);
    exit;
}

$trashFilename = time() . '_' . basename($file);
$dest          = $trashDir . '/' . $trashFilename;

if (!rename($targetFile, $dest)) {
    echo json_encode(['success' => false, 'message' => 'Impossible de déplacer vers la corbeille']);
    exit;
}

// Enregistrer en DB dans la table trash
try {
    $stmt = $pdo->prepare("
        INSERT INTO trash (original_name, original_path, trash_filename, deleted_by, deleted_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$file, $path, $trashFilename, $_SESSION['user_id']]);
} catch (PDOException $e) {
    error_log('Erreur insert trash : ' . $e->getMessage());
}

// Supprimer de la table files
try {
    $stmt = $pdo->prepare("DELETE FROM files WHERE name = ? AND path = ?");
    $stmt->execute([$file, $path]);
} catch (PDOException $e) {
    error_log('Erreur delete files : ' . $e->getMessage());
}

logAction($_SESSION['user_id'], 'DELETE_TO_TRASH', $path . '/' . $file);

echo json_encode(['success' => true, 'message' => 'Déplacé vers la corbeille']);
