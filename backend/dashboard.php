<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

function diskStats(string $dir): array {
    $stats = ['files' => 0, 'folders' => 0, 'size' => 0];
    if (!is_dir($dir)) return $stats;
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($it as $item) {
        if ($item->isDir()) { $stats['folders']++; continue; }
        $stats['files']++; $stats['size'] += $item->getSize();
    }
    return $stats;
}

function formatBytes(int $bytes): string {
    if ($bytes <= 0) return '0 o';
    $units = ['o','Ko','Mo','Go'];
    $i = 0; $v = $bytes;
    while ($v >= 1024 && $i < count($units)-1) { $v /= 1024; $i++; }
    return round($v, 1) . ' ' . $units[$i];
}

$disk = diskStats(__DIR__ . '/uploads');

// Activité récente (tous rôles voient leur propre activité, admin voit tout)
$isAdmin = isAdmin();
if ($isAdmin) {
    $logsStmt = $pdo->query("
        SELECT h.created_at AS date, COALESCE(u.username,'?') AS user,
               h.action, h.file_path AS target
        FROM historique h
        LEFT JOIN users u ON u.id = h.user_id
        ORDER BY h.created_at DESC LIMIT 8
    ");
} else {
    $stmt = $pdo->prepare("
        SELECT h.created_at AS date, COALESCE(u.username,'?') AS user,
               h.action, h.file_path AS target
        FROM historique h
        LEFT JOIN users u ON u.id = h.user_id
        WHERE h.user_id = ?
        ORDER BY h.created_at DESC LIMIT 8
    ");
    $stmt->execute([$userId]);
    $logsStmt = $stmt;
}

// Fichiers récemment modifiés sur le disque
$recentFiles = [];
$uploadsDir  = __DIR__ . '/uploads';
if (is_dir($uploadsDir)) {
    $files = [];
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($uploadsDir, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $f) {
        if ($f->isFile()) {
            $files[] = [
                'name'     => $f->getFilename(),
                'path'     => str_replace($uploadsDir . DIRECTORY_SEPARATOR, '', $f->getPathname()),
                'size'     => $f->getSize(),
                'modified' => $f->getMTime(),
                'ext'      => strtolower($f->getExtension()),
            ];
        }
    }
    usort($files, fn($a,$b) => $b['modified'] - $a['modified']);
    $recentFiles = array_slice($files, 0, 6);
}

// Stats utilisateurs (admin seulement)
$userStats = null;
if ($isAdmin) {
    $userStats = [
        'total'   => (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
        'pending' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE status='pending'")->fetchColumn(),
        'admins'  => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role_id=1")->fetchColumn(),
    ];
}

echo json_encode([
    'success'     => true,
    'username'    => $_SESSION['username'] ?? '',
    'role'        => roleName((int)($_SESSION['role_id'] ?? 2)),
    'disk'        => ['files' => $disk['files'], 'folders' => $disk['folders'], 'size' => formatBytes($disk['size']), 'bytes' => $disk['size']],
    'recent_logs' => $logsStmt->fetchAll(),
    'recent_files'=> $recentFiles,
    'user_stats'  => $userStats,
]);
