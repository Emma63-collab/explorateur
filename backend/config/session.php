<?php
/*
 * Démarrage de session centralisé.
 *
 * Un frontend (Vite, ex. http://localhost:5173) et un backend
 * (Apache/XAMPP, ex. http://localhost/explorateur/backend) sur des
 * PORTS différents restent le MÊME "site" au sens de SameSite
 * (seuls le protocole et le domaine comptent, pas le port). Le cookie
 * de session avec SameSite=Lax est donc bien envoyé sur ces requêtes :
 * pas besoin, et surtout pas question, de SameSite=None ici.
 *
 * (Correction : une version précédente de ce fichier forçait
 * SameSite=None sans Secure, en pensant résoudre un souci cross-origin
 * qui n'existait pas. Conséquence réelle : Firefox refuse de poser un
 * cookie SameSite=None non Secure, et Chrome ne l'accepte que sur
 * l'hôte exact "localhost" -> la session ne se posait plus du tout,
 * cassant login, listing de fichiers, upload, admin, etc. Ne pas
 * reproduire cette erreur.)
 *
 * SameSite=None + Secure (HTTPS) ne redevient utile QUE si un jour le
 * frontend est servi depuis un VRAI domaine différent du backend
 * (ex: frontend.mondomaine.com vs api.mondomaine.com) — pas notre cas.
 *
 * Ce fichier doit être inclus EN PREMIER, avant tout session_start(),
 * dans chaque script qui touche à la session.
 */

if (session_status() === PHP_SESSION_NONE) {
    // HTTPS détecté (proxy inclus) -> on peut activer Secure sans risque.
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',       // laisse le navigateur déduire le domaine courant
        'secure'   => $https,   // true en HTTPS, false en HTTP local (XAMPP) — cohérent avec SameSite=Lax
        'httponly' => true,     // pas d'accès JS au cookie (protection XSS)
        'samesite' => 'Lax',    // suffisant : même hostname "localhost", ports différents = même site
    ]);

    session_start();
}

