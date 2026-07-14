import { useState } from "react";
import { API } from "./config.js";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/login.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Erreur de connexion");
        setLoading(false);
        return;
      }

      // succès -> notifier App
      onLoginSuccess({
        role: data.role,
        username: data.username
      });

    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f172a",
      color: "white",
      fontFamily: "Arial"
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          width: "350px",
          background: "#111827",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 0 15px rgba(0,0,0,0.5)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Connexion Filenix
        </h2>

        {error && (
          <p style={{
            background: "#7f1d1d",
            padding: "10px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px"
          }}>
            ❌ {error}
          </p>
        )}

        <label>Nom d'utilisateur</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "none",
            outline: "none"
          }}
        />

        <label>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "none",
            outline: "none"
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
