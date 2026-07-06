<?php
require_once __DIR__ . '/config/cors.php';

/* ==========================
   CORS
========================== */

/* Préflight */
/* AUTH + PERMISSIONS */
require_once __DIR__ . "/auth/auth.php";
require_once __DIR__ . "/permissions/requireEditeur.php";
require_once __DIR__ . "/utils/backup.php";
require_once __DIR__ . "/utils/logger.php";

/* ==========================
   FONCTION COPIE RECURSIVE
========================== */
function copyRecursive($src, $dst) {
    if (is_file($src)) {
        return copy($src, $dst);
    }

    if (is_dir($src)) {
        if (!file_exists($dst)) {
            mkdir($dst, 0777, true);
        }

        $items = array_diff(scandir($src), ['.', '..']);
        foreach ($items as $item) {
            copyRecursive($src . "/" . $item, $dst . "/" . $item);
        }
        return true;
    }

    return false;
}

/* ==========================
   DONNÉES
========================== */
$data = json_decode(file_get_contents("php://input"), true);

$files = $data['files'] ?? [];
$targetPath = $data['targetPath'] ?? '.';
$mode = $data['mode'] ?? 'copy';

$baseDir = realpath(__DIR__ . '/uploads');
$targetDir = realpath($baseDir . '/' . $targetPath);

if (!$targetDir || strpos($targetDir, $baseDir) !== 0) {
    echo json_encode(["success" => false, "message" => "Chemin invalide"]);
    exit;
}

/* ==========================
   TRAITEMENT
========================== */
foreach ($files as $file) {

    $source = realpath($baseDir . '/' . $file['path'] . '/' . $file['name']);
    $dest = $targetDir . '/' . $file['name'];

    if (!$source || strpos($source, $baseDir) !== 0) {
        continue;
    }

    if (file_exists($dest)) {
        echo json_encode([
            "success" => false,
            "message" => "Le fichier existe déjà"
        ]);
        exit;
    }

    if ($mode === 'cut') {
        backupFile($source);
        logAction($_SESSION['user_id'], "CUT", $file['path'] . "/" . $file['name'] . " -> " . $targetPath);

        rename($source, $dest);

    } else {
        logAction($_SESSION['user_id'], "COPY", $file['path'] . "/" . $file['name'] . " -> " . $targetPath);

        copyRecursive($source, $dest);
    }
}

echo json_encode(["success" => true]);
