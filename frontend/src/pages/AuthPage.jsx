import { useState } from "react";
import "./AuthPage.css";
import { API } from "../config.js";

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "login"
          ? `${API}/login.php`
          : `${API}/register.php`;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        showMessage(data.message || "Une erreur est survenue.", "error");
        return;
      }

      if (mode === "register") {
        showMessage(data.message || "Compte créé — en attente de validation par un administrateur.", "success");
        setMode("login");
        setPassword("");
        return;
      }

      showMessage("Connexion réussie.", "success");

      onLoginSuccess({
        role: data.role,
        username: data.username,
      });
    } catch {
      showMessage("Serveur introuvable. Vérifie que XAMPP est lancé.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Présentation">
        <div className="brand-badge">EM</div>
        <div className="visual-copy">
          <p className="kicker">EMM'S Files</p>
          <h1>EMM'S Files</h1>
          <p>
            Gérez, organisez et partagez vos documents en toute sécurité —
            avec des droits utilisateurs précis et un historique complet.
          </p>
        </div>

        <div className="capability-list">
          <div>
            <strong>Administration</strong>
            <span>Rôles, sessions et actions réservées.</span>
          </div>
          <div>
            <strong>Cycle de vie</strong>
            <span>Corbeille, restauration et versions.</span>
          </div>
          <div>
            <strong>Productivité</strong>
            <span>Recherche, aperçu, upload et édition texte.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="mode-switch" role="tablist" aria-label="Mode d'accès">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => setMode("login")}
            disabled={loading}
          >
            Connexion
          </button>
          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => setMode("register")}
            disabled={loading}
          >
            Inscription
          </button>
        </div>

        <div className="panel-heading">
          <p>{isLogin ? "Accès sécurisé" : "Nouveau compte"}</p>
          <h2>{isLogin ? "Bon retour" : "Créer un compte"}</h2>
          <span>
            {isLogin
              ? "Connecte-toi pour accéder à ton espace de fichiers."
              : "Crée un accès utilisateur pour tester les rôles."}
          </span>
        </div>

        {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-username">Nom d'utilisateur</label>
          <input
            id="auth-username"
            type="text"
            placeholder="Entrer nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoComplete="username"
          />

          <label htmlFor="auth-password">Mot de passe</label>
          <div className="password-field">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              placeholder="Entrer le mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={loading}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? "Masquer" : "Voir"}
            </button>
          </div>

          {isLogin && (
            <div className="form-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((value) => !value)}
                />
                Se souvenir de moi
              </label>
              <button
                type="button"
                onClick={() => showMessage("Fonction non disponible pour le moment.", "info")}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? "Traitement..." : isLogin ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
      </section>
    </main>
  );
}
