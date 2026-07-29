<?php
require_once __DIR__ . '/config/cors.php';


require_once __DIR__ . "/permissions/requireEditeur.php";
require_once __DIR__ . "/utils/backup.php";
require_once __DIR__ . "/utils/logger.php";
require_once __DIR__ . "/config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$oldName = $data['oldName'] ?? '';
$newName = $data['newName'] ?? '';
$path = $data['path'] ?? '.';

if (!$oldName || !$newName) {
    echo json_encode(["success" => false, "message" => "Nom invalide"]);
    exit;
}

// Un nom est un seul segment : ni chemin, ni dossier parent.
if ($oldName !== basename($oldName) || $newName !== basename($newName)
    || in_array($oldName, ['.', '..'], true) || in_array($newName, ['.', '..'], true)) {
    echo json_encode(["success" => false, "message" => "Nom de fichier invalide"]);
    exit;
}

$baseDir = realpath(__DIR__ . '/uploads');
$targetDir = realpath($baseDir . '/' . $path);
$oldFile = $targetDir ? realpath($targetDir . '/' . $oldName) : false;
$newFile = $targetDir ? $targetDir . DIRECTORY_SEPARATOR . $newName : '';

if (!$targetDir || strpos($targetDir, $baseDir) !== 0 || !$oldFile || strpos($oldFile, $baseDir) !== 0) {
    echo json_encode(["success" => false, "message" => "Accès interdit"]);
    exit;
}

if (file_exists($newFile)) {
    echo json_encode(["success" => false, "message" => "Ce nom existe déjà"]);
    exit;
}

backupFile($oldFile);

if (rename($oldFile, $newFile)) {

    //  UPDATE DB AVANT réponse
    try {
        $smt = $pdo->prepare("
            UPDATE files 
            SET name = ?
            WHERE name = ? AND path = ?
        ");
        $smt->execute([$newName, $oldName, $path]);

    } catch (PDOException $e) {
        error_log("Erreur mise à jour DB: " . $e->getMessage());
    }

    logAction($_SESSION['user_id'], "rename", $path . "/" . $oldName . " -> " . $newName);

    //  réponse à la fin
    echo json_encode(["success" => true]);

} else {
    echo json_encode([
        "success" => false,
        "message" => "Échec du renommage"
    ]);
}
