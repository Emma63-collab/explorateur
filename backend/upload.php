<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/permissions/requireEditeur.php';
require_once __DIR__ . '/auth/auth.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/logger.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu']);
    exit;
}

// -----------------------------------------------
// VALIDATION DU TYPE MIME (nouvelle sécurité)
// -----------------------------------------------
$allowed_mime_types = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Texte
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    'text/markdown',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    // Audio / Vidéo
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
];

$file     = $_FILES['file'];
$tmp_path = $file['tmp_name'];

// Lire le vrai type MIME depuis le contenu du fichier (pas l'extension)
$finfo     = new finfo(FILEINFO_MIME_TYPE);
$real_mime = $finfo->file($tmp_path);

if (!in_array($real_mime, $allowed_mime_types, true)) {
    echo json_encode([
        'success' => false,
        'message' => "Type de fichier non autorisé ($real_mime)",
    ]);
    exit;
}

// -----------------------------------------------
// VALIDATION DU CHEMIN
// -----------------------------------------------
$path = $_POST['path'] ?? '.';

if (str_contains($path, '..')) {
    echo json_encode(['success' => false, 'message' => 'Chemin invalide']);
    exit;
}

$baseDir   = realpath(__DIR__ . '/uploads');
$targetDir = $baseDir . '/' . $path;

if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$realTarget = realpath($targetDir);

if (!$baseDir || !$realTarget || strpos($realTarget, $baseDir) !== 0) {
    echo json_encode(['success' => false, 'message' => 'Accès interdit']);
    exit;
}

// -----------------------------------------------
// UPLOAD
// -----------------------------------------------
$filename    = basename($file['name']);
$destination = $targetDir . '/' . $filename;

if (file_exists($destination)) {
    echo json_encode(['success' => false, 'message' => 'Un fichier avec ce nom existe déjà']);
    exit;
}

if (!move_uploaded_file($tmp_path, $destination)) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload']);
    exit;
}

// -----------------------------------------------
// ENREGISTREMENT EN BASE
// -----------------------------------------------
$filePath = ($path === '.' ? '' : $path) . '/' . $filename;
$filePath = ltrim($filePath, '/');

// Historique
try {
    $stmt = $pdo->prepare("
        INSERT INTO historique (user_id, action, file_path, target_user, created_at)
        VALUES (?, 'UPLOAD', ?, NULL, NOW())
    ");
    $stmt->execute([$_SESSION['user_id'], $filePath]);
} catch (PDOException $e) {
    error_log('Erreur historique upload : ' . $e->getMessage());
}

// Table files
try {
    $stmt = $pdo->prepare("
        INSERT INTO files (name, path, type, size, mime_type, user_id, created_at)
        VALUES (?, ?, 'file', ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $filename,
        $path,
        $file['size'],
        $real_mime,               // mime_type enregistré en DB
        $_SESSION['user_id'],
    ]);

    // Correction du bug : récupérer le vrai ID inséré
    $fileId = (int)$pdo->lastInsertId();

    // Permissions par défaut pour le propriétaire
    $stmt = $pdo->prepare("
        INSERT INTO file_permissions (file_id, user_id, can_read, can_write, can_delete)
        VALUES (?, ?, 1, 1, 1)
    ");
    $stmt->execute([$fileId, $_SESSION['user_id']]);

} catch (PDOException $e) {
    error_log('Erreur DB upload : ' . $e->getMessage());
    // Ne bloque pas l'upload — le fichier est déjà sur le disque
}

logAction($_SESSION['user_id'], 'UPLOAD', $filePath);

echo json_encode([
    'success' => true,
    'message' => 'Fichier uploadé avec succès',
    'file'    => ['name' => $filename, 'path' => $path, 'mime' => $real_mime],
]);
