<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/auth/auth.php';

// Authentification obligatoire — manquait complètement avant
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$q = trim($_GET['q'] ?? '');

if ($q === '') {
    echo json_encode([]);
    exit;
}

$baseDir = realpath(__DIR__ . '/uploads');

if (!$baseDir) {
    echo json_encode([]);
    exit;
}

$result = [];

function searchFiles(string $dir, string $baseDir, string $q, array &$result): void {
    $items = @scandir($dir);
    if (!$items) return;

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;

        $fullPath = $dir . '/' . $item;
        $realFull = realpath($fullPath);

        // Sécurité : rester dans uploads
        if (!$realFull || strpos($realFull, $baseDir) !== 0) continue;

        if (stripos($item, $q) !== false) {
            $result[] = [
                'name' => $item,
                'type' => is_dir($fullPath) ? 'folder' : 'file',
                'path' => str_replace($baseDir . '/', '', $dir),
                'size' => is_file($fullPath) ? filesize($fullPath) : null,
            ];
        }

        if (is_dir($fullPath)) {
            searchFiles($fullPath, $baseDir, $q, $result);
        }
    }
}

searchFiles($baseDir, $baseDir, $q, $result);

echo json_encode($result);
