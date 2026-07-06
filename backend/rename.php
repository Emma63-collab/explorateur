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

$baseDir = realpath(__DIR__ . '/uploads');
$oldFile = realpath($baseDir . '/' . $path . '/' . $oldName);
$newFile = $baseDir . '/' . $path . '/' . $newName;

if (!$oldFile || strpos($oldFile, $baseDir) !== 0) {
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