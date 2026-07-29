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

function tableCount(PDO $pdo, string $table): int {
    try {
        return (int) $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    } catch (Throwable $e) {
        return 0;
    }
}

function diskStats(string $dir): array {
    $stats = ['files' => 0, 'folders' => 0, 'size' => 0];

    if (!is_dir($dir)) {
        return $stats;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        if ($item->isDir()) {
            $stats['folders']++;
            continue;
        }

        $stats['files']++;
        $stats['size'] += $item->getSize();
    }

    return $stats;
}

$usersStmt = $pdo->query("
    SELECT
        u.id,
        u.username,
        u.email,
        u.role_id,
        CASE
            WHEN u.role_id = 1 THEN 'admin'
            WHEN u.role_id = 3 THEN 'editeur'
            ELSE 'lecteur'
        END AS role,
        u.status,
        u.created_at
    FROM users u
    ORDER BY
        CASE u.status WHEN 'pending' THEN 0 ELSE 1 END,
        u.role_id ASC,
        u.username ASC
    LIMIT 200
");

$logsStmt = $pdo->query("
    SELECT
        h.created_at AS date,
        COALESCE(u.username, CONCAT('Utilisateur #', h.user_id)) AS user,
        h.action,
        h.file_path AS target
    FROM historique h
    LEFT JOIN users u ON u.id = h.user_id
    ORDER BY h.created_at DESC
    LIMIT 12
");

$disk = diskStats(__DIR__ . '/uploads');

echo json_encode([
    'success' => true,
    'stats' => [
        'users' => tableCount($pdo, 'users'),
        'admins' => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role_id = 1")->fetchColumn(),
        'db_files' => tableCount($pdo, 'files'),
        'versions' => tableCount($pdo, 'versions'),
        'logs' => tableCount($pdo, 'historique'),
        'disk_files' => $disk['files'],
        'disk_folders' => $disk['folders'],
        'disk_size' => $disk['size'],
    ],
    'users' => $usersStmt->fetchAll(),
    'logs' => $logsStmt->fetchAll(),
]);
