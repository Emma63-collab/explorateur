<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/permissions/requireLogin.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;



require_once __DIR__ . "/auth/auth.php";
require_once __DIR__ . "/permissions/requireLogin.php";

$baseDir = realpath(__DIR__ . "/uploads");

$path = $_GET["path"] ?? "";

// 🔥 Nettoyage
$path = ltrim($path, "/\\");
$path = str_replace("\\", "/", $path);

if ($path === "" || str_contains($path, "..")) {
    echo json_encode(["success" => false, "message" => "Chemin invalide"]);
    exit;
}

$filePath = $baseDir . "/" . $path;

if (!file_exists($filePath) || is_dir($filePath)) {
    echo json_encode(["success" => false, "message" => "Fichier introuvable"]);
    exit;
}

$content = file_get_contents($filePath);

echo json_encode([
    "success" => true,
    "content" => $content
]);
