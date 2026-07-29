<?php
require_once __DIR__ . '/../config/env.php';

function roleLabel(string $role): string
{
    return ['admin' => 'Administrateur', 'editeur' => 'Éditeur', 'lecteur' => 'Lecteur'][$role] ?? $role;
}
function smtpRead($socket): string
{
    $response = '';
    do {
        $line = fgets($socket, 515);
        if ($line === false) throw new RuntimeException('Réponse SMTP absente.');
        $response .= $line;
    } while (isset($line[3]) && $line[3] === '-');
    return $response;
}
function smtpCommand($socket, string $command, array $expected): string
{
    fwrite($socket, $command . "\r\n");
    $response = smtpRead($socket);
    if (!in_array((int) substr($response, 0, 3), $expected, true)) throw new RuntimeException('Commande SMTP refusée.');
    return $response;
}
/** Envoie une notification via le bac à sable Mailtrap configuré dans .env. */
function sendMailtrapNotification(string $to, string $username, array $changes): array
{
    $smtpUser = getenv('MAILTRAP_USERNAME') ?: '';
    $smtpPass = getenv('MAILTRAP_PASSWORD') ?: '';
    if ($smtpUser === '' || $smtpPass === '') return ['sent' => false, 'reason' => 'Configuration Mailtrap absente'];
    $host = getenv('MAILTRAP_HOST') ?: 'sandbox.smtp.mailtrap.io';
    $port = (int) (getenv('MAILTRAP_PORT') ?: 2525);
    $from = getenv('MAIL_FROM_ADDRESS') ?: 'no-reply@example.test';
    $fromName = getenv('MAIL_FROM_NAME') ?: "EMM'S Files";
    $socket = @stream_socket_client("tcp://$host:$port", $errno, $errstr, 10, STREAM_CLIENT_CONNECT);
    if (!$socket) return ['sent' => false, 'reason' => 'Connexion Mailtrap impossible'];
    try {
        stream_set_timeout($socket, 10);
        smtpRead($socket); smtpCommand($socket, 'EHLO emm-files.local', [250]);
        smtpCommand($socket, 'STARTTLS', [220]);
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('TLS indisponible.');
        smtpCommand($socket, 'EHLO emm-files.local', [250]);
        smtpCommand($socket, 'AUTH LOGIN', [334]); smtpCommand($socket, base64_encode($smtpUser), [334]); smtpCommand($socket, base64_encode($smtpPass), [235]);
        smtpCommand($socket, "MAIL FROM:<$from>", [250]); smtpCommand($socket, "RCPT TO:<$to>", [250, 251]); smtpCommand($socket, 'DATA', [354]);
        $lines = [];
        if (in_array('approved', $changes, true)) $lines[] = 'Votre compte a été validé.';
        if (isset($changes['role'])) $lines[] = 'Votre rôle est désormais : ' . roleLabel($changes['role']) . '.';
        if (in_array('blocked', $changes, true)) $lines[] = 'Votre compte a été bloqué. Contactez un administrateur pour toute question.';
        $subject = in_array('blocked', $changes, true) ? 'Votre accès a été bloqué' : 'Mise à jour de votre compte';
        $text = "Bonjour $username,\n\n" . implode("\n", $lines) . "\n\n— EMM'S Files";
        $headers = ["From: $fromName <$from>", "To: $username <$to>", 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=', 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit'];
        smtpCommand($socket, implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n.", "\n..", $text) . "\r\n.", [250]);
        smtpCommand($socket, 'QUIT', [221]);
        return ['sent' => true];
    } catch (Throwable $e) {
        return ['sent' => false, 'reason' => 'Envoi Mailtrap impossible'];
    } finally { fclose($socket); }
}
