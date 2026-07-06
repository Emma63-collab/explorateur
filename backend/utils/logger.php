<?php
/*
 * Logger centralisé — écrit dans la table historique EN DB.
 * Plus de fichier actions.log en clair sur le disque.
 */

function logAction(int $userId, string $action, string $filePath, ?int $targetUser = null): void {
    global $pdo;

    if (!isset($pdo)) return;

    try {
        $stmt = $pdo->prepare("
            INSERT INTO historique (user_id, action, file_path, target_user, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $action, $filePath, $targetUser]);
    } catch (PDOException $e) {
        // Ne bloque pas l'action principale — on log juste dans le log serveur
        error_log('Erreur logAction : ' . $e->getMessage());
    }
}
