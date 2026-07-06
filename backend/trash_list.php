<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$trashDir = __DIR__ . '/trash';

try {
    // Lire depuis la table trash (source de vérité)
    $stmt = $pdo->prepare("
        SELECT t.id, t.original_name, t.original_path, t.trash_filename,
               t.deleted_at, u.username AS deleted_by_name
        FROM trash t
        LEFT JOIN users u ON t.deleted_by = u.id
        WHERE t.restored = 0
        ORDER BY t.deleted_at DESC
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $files = [];
    foreach ($rows as $row) {
        $fullPath = $trashDir . '/' . $row['trash_filename'];
        $files[] = [
            'id'           => $row['id'],
            'name'         => $row['original_name'],
            'original_path'=> $row['original_path'],
            'trash_name'   => $row['trash_filename'],
            'deleted_at'   => $row['deleted_at'],
            'deleted_by'   => $row['deleted_by_name'],
            'size'         => file_exists($fullPath) ? filesize($fullPath) : null,
            'exists'       => file_exists($fullPath),
        ];
    }

    echo json_encode(['success' => true, 'files' => $files]);

} catch (PDOException $e) {
    error_log('Erreur trash_list : ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur base de données']);
}
