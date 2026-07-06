<?php

function backupFile(string $filePath)
{
    $baseUploads = realpath(__DIR__ . '/../uploads');
    $baseBackups = realpath(__DIR__ . '/../backups');

    if (!$baseBackups) {
        mkdir(__DIR__ . '/../backups', 0777, true);
        $baseBackups = realpath(__DIR__ . '/../backups');
    }

    $realFile = realpath($filePath);

    if (!$realFile || strpos($realFile, $baseUploads) !== 0) {
        return false;
    }

    $relativePath = str_replace($baseUploads . DIRECTORY_SEPARATOR, '', $realFile);
    $dateFolder = date('Y-m-d');

    $backupDir = $baseBackups . '/' . $dateFolder . '/' . dirname($relativePath);

    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0777, true);
    }

    $filename = basename($relativePath);
    $timestamp = time();

    $backupFile = $backupDir . '/' . $filename . '_' . $timestamp;

    copy($realFile, $backupFile);
    return true;
}
