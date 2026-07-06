<?php

function logAction($user, $action, $target, $path = '') {
    $date = date("Y-m-d H:i:s");

    $line = "[$date] | $user | $action | $target | $path\n";

    $logDir = __DIR__ . "/logs";
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }

    file_put_contents("$logDir/actions.log", $line, FILE_APPEND);
}
