<?php
session_start();
require_once __DIR__ . '/backend/auth/auth.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    $user = login($username, $password);

    if ($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['username'] = $user['username'];

        header("Location: dashboard.php");
        exit();
    }

    $error = "Nom d'utilisateur ou mot de passe incorrect.";
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - Explorateur de fichiers</title>
    <style>
        :root {
            color: #172033;
            font-family: Inter, "Segoe UI", Arial, sans-serif;
            background: #eef3f8;
        }

        * {
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            margin: 0;
            display: grid;
            place-items: center;
            background:
                radial-gradient(circle at 18% 20%, rgba(20, 184, 166, 0.18), transparent 28%),
                radial-gradient(circle at 80% 12%, rgba(37, 99, 235, 0.18), transparent 28%),
                linear-gradient(135deg, #eef3f8 0%, #f8fbfd 48%, #e9f0f7 100%);
        }

        .login-shell {
            width: min(1040px, calc(100% - 32px));
            min-height: 610px;
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            overflow: hidden;
            border: 1px solid rgba(126, 142, 162, 0.25);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.92);
            box-shadow: 0 24px 70px rgba(24, 39, 75, 0.18);
        }

        .brand-panel {
            padding: 52px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #f8fafc;
            background:
                linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.9)),
                url("frontend/src/assets/background.png") center / cover;
        }

        .brand-mark {
            width: 54px;
            height: 54px;
            display: grid;
            place-items: center;
            border-radius: 8px;
            background: #14b8a6;
            color: #052e2b;
            font-size: 28px;
            font-weight: 900;
        }

        .brand-panel h1 {
            max-width: 440px;
            margin: 32px 0 14px;
            font-size: clamp(34px, 5vw, 52px);
            line-height: 1.02;
            letter-spacing: 0;
        }

        .brand-panel p {
            max-width: 460px;
            margin: 0;
            color: rgba(248, 250, 252, 0.82);
            font-size: 16px;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 44px;
        }

        .feature {
            min-height: 86px;
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
        }

        .feature strong {
            display: block;
            margin-bottom: 4px;
            color: #ffffff;
            font-size: 14px;
        }

        .feature span {
            color: rgba(248, 250, 252, 0.72);
            font-size: 13px;
        }

        .form-panel {
            padding: 56px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .eyebrow {
            margin: 0 0 10px;
            color: #0f766e;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .form-panel h2 {
            margin: 0;
            color: #101828;
            font-size: 32px;
            letter-spacing: 0;
        }

        .subtitle {
            margin: 10px 0 30px;
            color: #64748b;
            font-size: 15px;
        }

        .error {
            margin-bottom: 18px;
            padding: 12px 14px;
            border: 1px solid #fecaca;
            border-radius: 8px;
            color: #991b1b;
            background: #fff1f2;
            font-weight: 700;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #334155;
            font-size: 14px;
            font-weight: 800;
        }

        input {
            width: 100%;
            height: 48px;
            margin-bottom: 18px;
            padding: 0 14px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            color: #111827;
            background: #ffffff;
            font-size: 15px;
            outline: none;
        }

        input:focus {
            border-color: #14b8a6;
            box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.16);
        }

        .submit-btn {
            width: 100%;
            height: 50px;
            margin-top: 6px;
            border: 0;
            border-radius: 8px;
            color: #ffffff;
            background: #0f766e;
            font-size: 15px;
            font-weight: 900;
            cursor: pointer;
            transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .submit-btn:hover {
            transform: translateY(-1px);
            background: #115e59;
            box-shadow: 0 14px 26px rgba(15, 118, 110, 0.22);
        }

        .hint {
            margin-top: 20px;
            padding: 14px;
            border-radius: 8px;
            color: #475569;
            background: #f1f5f9;
            font-size: 13px;
        }

        @media (max-width: 860px) {
            body {
                padding: 24px 0;
            }

            .login-shell {
                grid-template-columns: 1fr;
                min-height: 0;
            }

            .brand-panel {
                padding: 34px;
            }

            .feature-grid {
                grid-template-columns: 1fr;
                margin-top: 28px;
            }

            .form-panel {
                padding: 34px;
            }
        }
    </style>
</head>
<body>
    <main class="login-shell">
        <section class="brand-panel" aria-label="Presentation de l'application">
            <div>
                <div class="brand-mark">E</div>
                <h1>Explorateur de fichiers</h1>
                <p>Une interface web claire pour organiser, previsualiser et administrer les documents du projet.</p>
            </div>

            <div class="feature-grid">
                <div class="feature">
                    <strong>Gestion de fichiers</strong>
                    <span>Ajout, suppression, renommage et navigation.</span>
                </div>
                <div class="feature">
                    <strong>Sessions securisees</strong>
                    <span>Acces separe entre administrateur et utilisateur.</span>
                </div>
                <div class="feature">
                    <strong>Corbeille</strong>
                    <span>Restauration et suppression definitive.</span>
                </div>
                <div class="feature">
                    <strong>Versions</strong>
                    <span>Historique et recuperation des fichiers.</span>
                </div>
            </div>
        </section>

        <section class="form-panel">
            <p class="eyebrow">Acces securise</p>
            <h2>Connexion</h2>
            <p class="subtitle">Connecte-toi pour acceder a ton espace de gestion.</p>

            <?php if ($error): ?>
                <div class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>

            <form method="POST" autocomplete="on">
                <label for="username">Nom d'utilisateur</label>
                <input id="username" type="text" name="username" placeholder="admin" required autofocus>

                <label for="password">Mot de passe</label>
                <input id="password" type="password" name="password" placeholder="admin123" required>

                <button class="submit-btn" type="submit">Se connecter</button>
            </form>

            <div class="hint">
                Compte de demonstration : <strong>admin</strong> / <strong>admin123</strong>
            </div>
        </section>
    </main>
</body>
</html>
