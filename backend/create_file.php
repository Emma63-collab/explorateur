<?php
require_once __DIR__ . '/config/cors.php';


if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

require_once __DIR__ . "/auth/auth.php";
require_once __DIR__ . "/permissions/requireEditeur.php";

$baseDir = __DIR__ . "/uploads";

$data = json_decode(file_get_contents("php://input"), true);

$path = $data["path"] ?? ".";
$name = trim($data["name"] ?? "");

if ($name === "") {
    echo json_encode(["success" => false, "message" => "Nom vide"]);
    exit;
}

$fullPath = realpath($baseDir . "/" . $path);

if (!$fullPath || !str_starts_with($fullPath, realpath($baseDir))) {
    echo json_encode(["success" => false, "message" => "Chemin invalide"]);
    exit;
}

$newFile = $fullPath . "/" . basename($name);

if (file_exists($newFile)) {
    echo json_encode(["success" => false, "message" => "Le fichier existe déjà"]);
    exit;
}

if (file_put_contents($newFile, "") !== false) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Impossible de créer le fichier"]);
}
