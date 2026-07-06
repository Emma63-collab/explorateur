<?php
require_once __DIR__ . '/backend/auth/auth.php';

if (!isLoggedIn()) {
    header('Location: index.php');
    exit();
}

header('Location: frontend/dist/');
exit();
