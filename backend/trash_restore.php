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

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = [];
}

// Accepte id depuis JSON, formulaire POST ou query string
$trashId = (int)(
    $data['id']
    ?? $data['trash_id']
    ?? $_POST['id']
    ?? $_GET['id']
    ?? 0
);

// Repli : retrouver l'élément par nom / nom corbeille
if ($trashId <= 0) {
    $lookup = trim((string)(
        $data['trash_name']
        ?? $data['trash_filename']
        ?? $data['file']
        ?? $data['name']
        ?? $_POST['file']
        ?? ''
    ));
    if ($lookup !== '') {
        try {
            $stmt = $pdo->prepare("
                SELECT id FROM trash
                WHERE restored = 0
                  AND (trash_filename = ? OR original_name = ?)
                ORDER BY id DESC
                LIMIT 1
            ");
            $stmt->execute([$lookup, $lookup]);
            $found = $stmt->fetchColumn();
            if ($found) {
                $trashId = (int) $found;
            }
        } catch (PDOException $e) {
            error_log('Erreur lookup trash restore : ' . $e->getMessage());
        }
    }
}

if ($trashId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'ID invalide',
        'debug'   => [
            'raw_body' => $raw !== false ? substr($raw, 0, 200) : null,
            'keys'     => array_keys($data),
        ],
    ]);
    exit;
}

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

if (!$trashDir || !$uploadsDir) {
    echo json_encode(['success' => false, 'message' => 'Dossiers système introuvables']);
    exit;
}

$source  = realpath($trashDir . DIRECTORY_SEPARATOR . $item['trash_filename']);
$destDir = $uploadsDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $item['original_path']);

if (!$source || strpos($source, $trashDir) !== 0) {
    echo json_encode(['success' => false, 'message' => 'Fichier corbeille invalide ou déjà déplacé']);
    exit;
}

if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
    echo json_encode(['success' => false, 'message' => 'Impossible de créer le dossier destination']);
    exit;
}

$destination = $destDir . DIRECTORY_SEPARATOR . $item['original_name'];

if (file_exists($destination)) {
    $destination = $destDir . DIRECTORY_SEPARATOR . time() . '_' . $item['original_name'];
}

if (!rename($source, $destination)) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la restauration']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE trash SET restored = 1, restored_at = NOW() WHERE id = ?");
    $stmt->execute([$trashId]);
} catch (PDOException $e) {
    error_log('Erreur update trash restore : ' . $e->getMessage());
}

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
