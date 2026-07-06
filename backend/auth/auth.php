<?php
/*
 * Fonctions d'authentification.
 * display_errors désactivé : les erreurs vont dans le log serveur, pas dans la réponse JSON.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';

function isLoggedIn(): bool {
    return isset($_SESSION['user_id']);
}

function isAdmin(): bool {
    return isset($_SESSION['role_id']) && (int)$_SESSION['role_id'] === 1;
}

function isEditeur(): bool {
    return isset($_SESSION['role_id']) && in_array((int)$_SESSION['role_id'], [1, 3], true);
}

/* Convertit un role_id en nom de rôle utilisé côté front (admin / editeur / lecteur) */
function roleName(int $roleId): string {
    return match ($roleId) {
        1 => 'admin',
        3 => 'editeur',
        default => 'lecteur',
    };
}

/*
 * Retourne :
 *  - le tableau utilisateur en cas de succès
 *  - false si identifiants invalides
 *  - 'pending' si le compte existe mais n'est pas encore validé
 *  - 'blocked' si le compte est bloqué
 */
function login(string $username, string $password): array|string|false {
    global $pdo;

    $stmt = $pdo->prepare("SELECT id, username, password, role_id, status FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        return false;
    }

    $status = $user['status'] ?? 'active';

    if ($status === 'pending') {
        return 'pending';
    }
    if ($status === 'blocked') {
        return 'blocked';
    }

    $_SESSION['user_id']  = $user['id'];
    $_SESSION['role_id']  = $user['role_id'];
    $_SESSION['username'] = $user['username'];

    return $user;
}

function logout(): void {
    session_unset();
    session_destroy();
}
