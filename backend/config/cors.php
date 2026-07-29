<?php
require_once __DIR__ . '/env.php';
/*
 * Headers CORS centralisés.
 * À inclure EN PREMIER dans chaque fichier PHP exposé.
 * Modifier ALLOWED_ORIGIN pour la mise en production.
 */

$allowed_origin = getenv('FRONTEND_URL') ?: 'http://localhost:5173';

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Répondre aux requêtes préflight OPTIONS et stopper
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
