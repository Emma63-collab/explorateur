<?php
// preview.php — sert les fichiers en inline sans forcer le téléchargement.
// NE PAS inclure cors.php ici : on sert du binaire, pas du JSON.

require_once __DIR__ . '/config/session.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    header('Content-Type: text/plain');
    exit("Non connecté");
}

$path    = $_GET['path'] ?? '';
$baseDir = realpath(__DIR__ . '/uploads');

if (!$baseDir) {
    http_response_code(500);
    exit("Dossier uploads introuvable");
}

$filePath = realpath($baseDir . '/' . $path);

if (!$filePath || strpos($filePath, $baseDir) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    exit("Fichier introuvable");
}

$mime = mime_content_type($filePath) ?: 'application/octet-stream';
$ext  = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

// Forcer le bon MIME pour certains types
$mimeMap = [
    'pdf'  => 'application/pdf',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
    'txt'  => 'text/plain; charset=utf-8',
    'md'   => 'text/plain; charset=utf-8',
    'mp4'  => 'video/mp4',
    'webm' => 'video/webm',
    'mp3'  => 'audio/mpeg',
    'ogg'  => 'audio/ogg',
    'wav'  => 'audio/wav',
];
if (isset($mimeMap[$ext])) $mime = $mimeMap[$ext];

header("Content-Type: $mime");
header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: private, max-age=3600');
header('X-Content-Type-Options: nosniff');

readfile($filePath);
exit;
