<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/permissions/requireEditeur.php';
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

// Récupérer les infos depuis la table trash
try {
    $stmt = $pdo->prepare("SELECT * FROM trash WHERE id = ? AND restored = 0 LIMIT 1");
    $stmt->execute([$trashId]);
    $item = $stmt->fetch();
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur base de données']);
    exit;
}

if (!$item) {
    echo json_encode(['success' => false, 'message' => 'Élément introuvable ou déjà restauré']);
    exit;
}

$trashDir   = realpath(__DIR__ . '/trash');
$uploadsDir = realpath(__DIR__ . '/uploads');

$source  = realpath($trashDir . '/' . $item['trash_filename']);
$destDir = $uploadsDir . '/' . $item['original_path'];

// Sécurité chemin
if (!$source || strpos($source, $trashDir) !== 0) {
    echo json_encode(['success' => false, 'message' => 'Fichier corbeille invalide']);
    exit;
}

// Créer le dossier de destination si nécessaire
if (!is_dir($destDir)) mkdir($destDir, 0755, true);

$destination = $destDir . '/' . $item['original_name'];

// Éviter d'écraser un fichier existant
if (file_exists($destination)) {
    $destination = $destDir . '/' . time() . '_' . $item['original_name'];
}

if (!rename($source, $destination)) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la restauration']);
    exit;
}

// Mettre à jour la table trash
try {
    $stmt = $pdo->prepare("UPDATE trash SET restored = 1, restored_at = NOW() WHERE id = ?");
    $stmt->execute([$trashId]);
} catch (PDOException $e) {
    error_log('Erreur update trash restore : ' . $e->getMessage());
}

// Réinsérer dans files
try {
    $stmt = $pdo->prepare("
        INSERT INTO files (name, path, type, size, user_id, created_at)
        VALUES (?, ?, 'file', ?, ?, NOW())
    ");
    $stmt->execute([
        $item['original_name'],
        $item['original_path'],
        file_exists($destination) ? filesize($destination) : null,
        $_SESSION['user_id'],
    ]);
} catch (PDOException $e) {
    error_log('Erreur réinsertion files après restore : ' . $e->getMessage());
}

logAction($_SESSION['user_id'], 'TRASH_RESTORE', $item['original_path'] . '/' . $item['original_name']);

echo json_encode(['success' => true, 'message' => 'Fichier restauré avec succès']);
