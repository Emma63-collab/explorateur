<?php
/** Charge les variables du fichier .env local sans écraser l'environnement serveur. */
function loadProjectEnv(): void
{
    static $loaded = false;
    if ($loaded) return;
    $loaded = true;
    $path = dirname(__DIR__, 2) . '/.env';
    if (!is_readable($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ($key === '' || getenv($key) !== false) continue;
        if (strlen($value) >= 2 && $value[0] === '"' && substr($value, -1) === '"') $value = substr($value, 1, -1);
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}
loadProjectEnv();
