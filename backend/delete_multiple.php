<?php
require_once __DIR__ . '/config/cors.php';

/*CORS*/

require_once __DIR__ . "/permissions/requireAdmin.php";
require_once __DIR__ . "/utils/backup.php";
require_once __DIR__ . "/utils/logger.php";
require_once __DIR__ . "/config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$files = $data["files"] ?? [];
$path  = $data["path"] ?? ".";

$baseDir   = realpath(__DIR__ . "/uploads");
$targetDir = realpath($baseDir . "/" . $path);

if (!$targetDir || strpos($targetDir, $baseDir) !== 0) {
    echo json_encode(["success" => false, "message" => "Chemin invalide"]);
    exit;
}

//  suppression récursive corrigée
function deleteRecursive($fullpath) {
    if (is_file($fullpath)) {
        unlink($fullpath);
    } elseif (is_dir($fullpath)) {
        foreach (array_diff(scandir($fullpath), ['.', '..']) as $item) {
            deleteRecursive($fullpath . "/" . $item); // ✅ correction
        }
        rmdir($fullpath);
    }
}

foreach ($files as $file) {

    $fullPath = realpath($targetDir . "/" . $file);

    if ($fullPath && strpos($fullPath, $baseDir) === 0) {

        backupFile($fullPath);

        deleteRecursive($fullPath);

        //  DELETE DB
        try {
            $stmt = $pdo->prepare("
                DELETE FROM files
                WHERE name = ? AND path = ?
            ");
            $stmt->execute([$file, $path]);

        } catch (PDOException $e) {
            error_log("Erreur delete multiple DB: " . $e->getMessage());
        }

        logAction($_SESSION['user_id'], "DELETE_MULTIPLE", $path . "/" . $file);
    }
}

echo json_encode(["success" => true]);