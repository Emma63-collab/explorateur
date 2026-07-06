<?php
/*
 Configuration de la base de données
 Connexion avec MySQLi
*/

$host = "localhost";
$user = "root";
$password = "";
$dbname = "explorateur";

// Connexion MySQLi
$conn = mysqli_connect($host, $user, $password, $dbname);

// Vérification de la connexion
if (!$conn) {
    die("Erreur de connexion à la base de données : " . mysqli_connect_error());
}



