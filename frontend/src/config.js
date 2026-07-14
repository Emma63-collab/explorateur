/**
 * Configuration centrale du frontend.
 *
 * URL de l'API PHP : modifie frontend/.env (variable VITE_API_URL)
 * selon l'emplacement du dossier dans htdocs et le port Apache.
 *
 * Exemples :
 *   VITE_API_URL=http://localhost/explorateur/backend   (dossier explorateur/, Apache :80)
 *   VITE_API_URL=http://localhost:8080/backend          (racine htdocs, Apache :8080)
 *   VITE_API_URL=http://localhost/backend               (racine htdocs, Apache :80)
 */
export const API = import.meta.env.VITE_API_URL || "http://localhost/explorateur/backend";
