<?php
/** Droits par fichier : propriétaire, administrateur ou droit explicitement accordé. */
function normaliseFilePath(string $path): array
{
    $path = trim(str_replace('\\', '/', $path), '/');
    if ($path === '' || str_contains($path, '..')) return ['', ''];
    $name = basename($path);
    $folder = dirname($path);
    return [$name, $folder === '.' ? '.' : $folder];
}

function getFileRecord(string $path): array|false
{
    global $pdo;
    [$name, $folder] = normaliseFilePath($path);
    if ($name === '') return false;
    $stmt = $pdo->prepare('SELECT id, user_id FROM files WHERE name = ? AND path = ? LIMIT 1');
    $stmt->execute([$name, $folder]);
    return $stmt->fetch();
}

function canAccessFile(string $path, string $right = 'read'): bool
{
    global $pdo;
    if (isAdmin()) return true;
    $file = getFileRecord($path);
    $userId = (int)($_SESSION['user_id'] ?? 0);
    if (!$file || !$userId) return false;
    if ((int)$file['user_id'] === $userId) return true;
    $column = $right === 'write' ? 'can_write' : ($right === 'delete' ? 'can_delete' : 'can_read');
    $stmt = $pdo->prepare("SELECT $column FROM file_permissions WHERE file_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([(int)$file['id'], $userId]);
    return (bool)$stmt->fetchColumn();
}

function canManageFileSharing(string $path): bool
{
    if (isAdmin()) return true;
    $file = getFileRecord($path);
    return $file && (int)$file['user_id'] === (int)($_SESSION['user_id'] ?? 0);
}
