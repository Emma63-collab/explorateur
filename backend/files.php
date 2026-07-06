<?php
require_once __DIR__ . '/config/cors.php';


require_once __DIR__ . '/auth/auth.php';

/*SÉCURITÉ AUTH*/
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Non autorisé"]);
    exit;
}

/*PARAMÈTRE CHEMIN*/
$path = $_GET['path'] ?? '.';

/* Interdire toute tentative de remontée */
if (str_contains($path, '..')) {
    echo json_encode(["error" => "Chemin invalide"]);
    exit;
}

/*DOSSIER RACINE*/
$baseDir = realpath(__DIR__ . '/uploads');
$targetPath = realpath($baseDir . '/' . $path);

/* Vérification sécurité */
if ($targetPath === false || strpos($targetPath, $baseDir) !== 0) {
    echo json_encode(["error" => "Chemin invalide"]);
    exit;
}

/*LECTURE DOSSIER*/
$items = scandir($targetPath);
$result = [];

foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;

    $fullPath = $targetPath . '/' . $item;

    if (is_dir($fullPath)) {
        $result[] = [
            "name" => $item,
            "type" => "folder"
        ];
    } else {
        $result[] = [
            "name" => $item,
            "type" => is_dir($fullPath) ? "folder" : "file",
            "size" => is_file($fullPath) ? filesize($fullPath) : null,
            "modified" => filemtime($fullPath)
        ];

    }
}

echo json_encode($result);
