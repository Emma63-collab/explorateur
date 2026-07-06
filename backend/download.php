<?php
require_once __DIR__ . '/config/cors.php';

require_once __DIR__ . "/utils/logger.php";


/* AUTH + PERMISSIONS */
require_once __DIR__ . "/permissions/requireLogin.php";
require_once __DIR__ . "/utils/backup.php";
require_once __DIR__ . "/utils/logger.php";


$file = $_GET['file'] ?? '';
$path = $_GET['path'] ?? '.';

$baseDir = realpath(__DIR__ . '/uploads');
$targetFile = realpath($baseDir . '/' . $path . '/' . $file);

if (!$targetFile || strpos($targetFile, $baseDir) !== 0 || !file_exists($targetFile)) {
    http_response_code(404);
    exit;
}

/*  LOG AVANT TÉLÉCHARGEMENT */
logAction(
    $_SESSION['user_id'],
    'download',
    $path . '/' . $file
);

/*  TÉLÉCHARGEMENT */
header('Content-Disposition: attachment; filename="' . basename($targetFile) . '"');
header('Content-Length: ' . filesize($targetFile));
readfile($targetFile);
exit;
