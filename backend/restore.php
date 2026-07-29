<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/permissions/requireEditeur.php';


if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Non connecté"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$versionPath = $data['versionPath'] ?? '';
$targetPath  = $data['targetPath'] ?? '';

$baseBackups = realpath(__DIR__ . "/backups");
$baseUploads = realpath(__DIR__ . "/uploads");

if (!$baseBackups || !$baseUploads) {
    echo json_encode(["success" => false, "message" => "Dossiers système introuvables"]);
    exit;
}

$source = realpath($baseBackups . "/" . $versionPath);

if (!$source || strpos($source, $baseBackups) !== 0 || !is_file($source)) {
    echo json_encode(["success" => false, "message" => "Version invalide"]);
    exit;
}

$dest = $baseUploads . "/" . $targetPath;
$destDir = dirname($dest);

/* sécurité : destination doit rester dans uploads */
$realDestDir = realpath($destDir);

if (!$realDestDir || strpos($realDestDir, $baseUploads) !== 0) {
    echo json_encode(["success" => false, "message" => "Destination invalide"]);
    exit;
}

/* création du fichier restauré */
if (!copy($source, $dest)) {
    echo json_encode(["success" => false, "message" => "Erreur lors de la restauration"]);
    exit;
}

echo json_encode(["success" => true, "message" => "Restauré avec succès"]);
