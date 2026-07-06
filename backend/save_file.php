<?php
require_once __DIR__ . '/config/cors.php';




require_once __DIR__ . "/auth/auth.php";
require_once __DIR__ . "/permissions/requireEditeur.php";
require_once __DIR__ . "/config/database.php";

$baseDir = realpath(__DIR__ . "/uploads");

$data = json_decode(file_get_contents("php://input"), true);

$path = $data["path"] ?? "";
$content = $data["content"] ?? "";

/* nettoyage */
$path = ltrim($path, "/\\");
$path = str_replace("\\", "/", $path);

if ($path === "" || str_contains($path, "..")) {
    echo json_encode(["success" => false, "message" => "Chemin invalide"]);
    exit;
}

/* séparer name et dossier */
$filename = basename($path);
$folder = dirname($path);

if ($folder === ".") $folder = "";

/* chemin complet */
$filePath = $baseDir . "/" . $path;

/* vérifier fichier */
if (!file_exists($filePath) || is_dir($filePath)) {
    echo json_encode(["success" => false, "message" => "Fichier introuvable"]);
    exit;
}

/* 🔥 récupérer file_id */
$stmt = $pdo->prepare("
    SELECT id FROM files WHERE name = ? AND path = ?
");
$stmt->execute([$filename, $folder]);
$fileData = $stmt->fetch();

if ($fileData) {

    $fileId = $fileData['id'];

    /* 📁 dossier versions */
    $versionsDir = __DIR__ . "/versions";
    if (!file_exists($versionsDir)) {
        mkdir($versionsDir, 0777, true);
    }

    /* 🕒 nom unique */
    $versionName = time() . "_" . $filename;
    $versionFullPath = $versionsDir . "/" . $versionName;

    /* 💾 sauvegarde ancienne version */
    copy($filePath, $versionFullPath);

    /* 🔥 INSERT DB */
    $stmt = $pdo->prepare("
        INSERT INTO versions (file_id, version_path, created_at)
        VALUES (?, ?, NOW())
    ");
    $stmt->execute([$fileId, $versionName]);
}

/* 💾 écriture nouveau contenu */
file_put_contents($filePath, $content);

echo json_encode([
    "success" => true,
    "message" => "Fichier sauvegardé avec version"
]);