<?php
require_once __DIR__ . '/config/cors.php';


if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

$file = $_GET['file'] ?? '';
$baseBackups = realpath(__DIR__ . '/backups');

$versions = [];

if ($baseBackups) {
    $rii = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($baseBackups)
    );

    foreach ($rii as $f) {
        if ($f->isFile() && str_contains($f->getFilename(), basename($file))) {
            $versions[] = [
                "name" => $f->getFilename(),
                "path" => str_replace($baseBackups . '/', '', $f->getPathname()),
                "date" => date("Y-m-d H:i:s", $f->getMTime())
            ];
        }
    }
}

echo json_encode($versions);
