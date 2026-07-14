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

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = [];
}

$trashId = (int)(
    $data['id']
    ?? $data['trash_id']
    ?? $_POST['id']
    ?? $_GET['id']
    ?? 0
);

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
                WHERE (trash_filename = ? OR original_name = ?)
                ORDER BY id DESC
                LIMIT 1
            ");
            $stmt->execute([$lookup, $lookup]);
            $found = $stmt->fetchColumn();
            if ($found) {
                $trashId = (int) $found;
            }
        } catch (PDOException $e) {
            error_log('Erreur lookup trash delete : ' . $e->getMessage());
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
if ($trashDir) {
    $target = realpath($trashDir . DIRECTORY_SEPARATOR . $item['trash_filename']);
    if ($target && strpos($target, $trashDir) === 0 && file_exists($target)) {
        unlink($target);
    }
}

try {
    $stmt = $pdo->prepare("DELETE FROM trash WHERE id = ?");
    $stmt->execute([$trashId]);
} catch (PDOException $e) {
    error_log('Erreur delete trash DB : ' . $e->getMessage());
}

logAction($_SESSION['user_id'], 'TRASH_DELETE_PERMANENT', $item['original_name']);

echo json_encode(['success' => true, 'message' => 'Supprimé définitivement']);
