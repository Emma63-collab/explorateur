<?php
/*
 Page d'upload de fichiers
 Accessible uniquement aux administrateurs
*/

require_once __DIR__ . '/backend/auth/auth.php';

// Vérifie que l'utilisateur est connecté
if (!isLoggedIn()) {
    header('Location: index.php');
    exit();
}

// Vérifie que l'utilisateur est admin
if (!isAdmin()) {
    echo "Accès refusé : vous n'êtes pas administrateur.";
    exit();
}

$message = "";

// Traitement du formulaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (isset($_FILES['file']) && $_FILES['file']['error'] === 0) {

        $uploadDir = __DIR__ . '/uploads/';
        $fileName = basename($_FILES['file']['name']);
        $targetFile = $uploadDir . $fileName;

        // Déplacement du fichier
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {
            $message = "Fichier envoyé avec succès.";
        } else {
            $message = "Erreur lors de l'envoi du fichier.";
        }

    } else {
        $message = "Aucun fichier sélectionné.";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Upload de fichiers</title>
</head>
<body>

<h2>Upload de document</h2>

<p style="color:green;">
    <?= htmlspecialchars($message) ?>
</p>

<form method="POST" enctype="multipart/form-data">
    <input type="file" name="file" required>
    <br><br>
    <button type="submit">Envoyer</button>
</form>

<br>
<a href="dashboard.php">Retour au dashboard</a>

</body>
</html>
