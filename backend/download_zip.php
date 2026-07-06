<?php
/*
 * download_zip.php — cas spécial : renvoie un fichier binaire ZIP, pas du JSON.
 * On gère CORS manuellement ici (pas de cors.php qui met Content-Type: application/json).
 */
require_once __DIR__ . '/auth/auth.php';

$allowed_origin = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isLoggedIn()) {
    http_response_code(401);
    exit('Non connecté');
}

$data  = json_decode(file_get_contents('php://input'), true);
$files = $data['files'] ?? [];

$baseDir = realpath(__DIR__ . '/uploads');

if (!$baseDir) {
    http_response_code(500);
    exit('Uploads introuvable');
}

if (count($files) === 0) {
    http_response_code(400);
    exit('Aucun fichier');
}

$zip    = new ZipArchive();
$tmpZip = tempnam(sys_get_temp_dir(), 'zip_') . '.zip';

if ($zip->open($tmpZip, ZipArchive::CREATE) !== true) {
    http_response_code(500);
    exit('Impossible de créer le ZIP');
}

foreach ($files as $f) {
    $name = $f['name'] ?? '';
    $path = $f['path'] ?? '.';

    if (!$name) continue;

    $realPath = realpath($baseDir . '/' . $path . '/' . $name);

    if (!$realPath || strpos($realPath, $baseDir) !== 0) continue;
    if (!is_file($realPath)) continue;

    $zip->addFile($realPath, $name);
}

$zip->close();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="download.zip"');
header('Content-Length: ' . filesize($tmpZip));

readfile($tmpZip);
unlink($tmpZip);
exit;
