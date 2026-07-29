<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/permissions/requireEditeur.php';


if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Non connecté"]);
    exit;
}

require_once __DIR__ . "/config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$versionId = $data['version_id'] ?? '';

if (!$versionId) {
    echo json_encode(["success" => false, "message" => "Version invalide"]);
    exit;
}

/* récupérer version */
$stmt = $pdo->prepare("
    SELECT v.version_path, f.name, f.path
    FROM versions v
    JOIN files f ON v.file_id = f.id
    WHERE v.id = ?
");
$stmt->execute([$versionId]);
$version = $stmt->fetch();

if (!$version) {
    echo json_encode(["success" => false, "message" => "Version introuvable"]);
    exit;
}

$versionsDir = __DIR__ . "/versions";
$uploadsDir = __DIR__ . "/uploads";

$source = $versionsDir . "/" . $version['version_path'];
$dest = $uploadsDir . "/" . $version['path'] . "/" . $version['name'];

/* restauration */
if (!copy($source, $dest)) {
    echo json_encode(["success" => false, "message" => "Erreur restauration"]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Version restaurée"
]);
