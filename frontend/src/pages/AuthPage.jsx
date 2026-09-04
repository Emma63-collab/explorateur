import { useEffect, useState } from "react";
import "./AuthPage.css";
import { api } from "../api/client.js";

export default function AuthPage({ onLoginSuccess }) {
  const [showRegister, setShowRegister] = useState(
    () => window.location.hash === "#inscription"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const openRegister = () => {
    if (window.history.state?.efAuth !== "inscription") {
      window.history.pushState({ efAuth: "inscription" }, "", `${window.location.pathname}${window.location.search}#inscription`);
    }
    setShowRegister(true);
  };

  const closeRegister = () => {
    if (window.history.state?.efAuth === "inscription" || window.location.hash === "#inscription") {
      window.history.back();
      return;
    }
    setShowRegister(false);
  };

  useEffect(() => {
    const sync = () => {
      const open = window.history.state?.efAuth === "inscription" || window.location.hash === "#inscription";
      setShowRegister(open);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(username, password);
      if (!data.success) {
        showMessage(data.message || "Une erreur est survenue.", "error");
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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      showMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await api.register(regUsername, regEmail, regPassword);
      if (!data.success) {
        showMessage(data.message || "Une erreur est survenue.", "error");
        return;
      }
      showMessage(data.message || "Compte créé — en attente de validation par un administrateur.", "success");
      setRegPassword("");
      closeRegister();
    } catch {
      showMessage("Serveur introuvable. Vérifie que XAMPP est lancé.", "error");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="panel-heading">
          <p>Accès sécurisé</p>
          <h2>Bon retour</h2>
          <span>Connecte-toi pour accéder à ton espace de fichiers.</span>
        </div>

        {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
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
              autoComplete="current-password"
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

          <div className="form-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe((value) => !value)}
              />
              Se souvenir de moi
            </label>
          </div>

          <button className="submit-button" type="submit" disabled={loading}>
            {loading && !showRegister ? "Traitement..." : "Se connecter"}
          </button>
        </form>

        <p className="auth-register-hint">
          Pas encore de compte ?
          <button type="button" onClick={openRegister} disabled={loading}>
            Créer un compte
          </button>
        </p>
      </section>

      {showRegister && (
        <div className="register-overlay" onClick={closeRegister} role="presentation">
          <section
            className="register-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="register-title"
          >
            <header className="register-header">
              <div>
                <p>Nouveau compte</p>
                <h2 id="register-title">Créer un compte</h2>
                <span>Le compte sera validé par un administrateur avant la première connexion.</span>
              </div>
              <button type="button" className="register-close" onClick={closeRegister}>
                Fermer
              </button>
            </header>

            {message && <div className={`auth-message ${message.type}`} style={{ margin: "0 28px 0" }}>{message.text}</div>}

            <form className="auth-form register-form" onSubmit={handleRegister}>
              <label htmlFor="reg-username">Nom d'utilisateur</label>
              <input
                id="reg-username"
                type="text"
                placeholder="ex: jean.dupont"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />

              <label htmlFor="reg-email">Adresse e-mail</label>
              <input
                id="reg-email"
                type="email"
                placeholder="nom@exemple.fr"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />

              <label htmlFor="reg-password">Mot de passe</label>
              <div className="password-field">
                <input
                  id="reg-password"
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Choisir un mot de passe"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((value) => !value)}
                  disabled={loading}
                  aria-label={showRegPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showRegPassword ? "Masquer" : "Voir"}
                </button>
              </div>

              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer le compte"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
