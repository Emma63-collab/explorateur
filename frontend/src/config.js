/**
 * Configuration centrale du frontend — chargée AU RUNTIME.
 *
 * Pourquoi runtime et pas juste une variable d'env (VITE_API_URL) ?
 * -------------------------------------------------------------
 * Une variable VITE_* est figée DANS le fichier JS au moment du
 * `npm run build`. Si quelqu'un déplace le projet, change de port
 * Apache ou teste sur une autre machine/VM, il devait avant rouvrir
 * le code, changer la valeur, et TOUT RECOMPILER.
 *
 * Ici, l'URL de l'API vit dans `frontend/public/config.json`, un
 * simple fichier JSON copié tel quel dans `dist/` au build (comportement
 * standard de Vite pour tout ce qui est dans `public/`). On peut donc :
 *   - éditer `config.json` DIRECTEMENT sur le serveur de prod, sans
 *     toucher au code ni relancer `npm run build`,
 *   - juste recharger la page dans le navigateur pour appliquer le
 *     changement.
 *
 * Ordre de priorité pour déterminer l'URL de l'API :
 *   1. frontend/public/config.json  → clé "api.baseUrl"   (RECOMMANDÉ)
 *   2. VITE_API_URL dans frontend/.env                    (repli build-time)
 *   3. http://localhost/explorateur/backend               (repli XAMPP par défaut)
 *
 * Utilisation dans un composant :
 *   import { getApiUrl } from "./config.js";
 *   ...
 *   await fetch(`${getApiUrl()}/files.php`)
 *
 * Mais dans 99% des cas, tu n'as pas besoin de ça : utilise plutôt
 * le client tout fait dans `src/api/client.js` (voir ce fichier),
 * qui connaît déjà toutes les routes (ex: `api.login(...)`).
 */

const DEFAULT_API_URL = "http://localhost/explorateur/backend";

let cachedApiUrl = null;
let loadPromise = null;

/**
 * Charge config.json une seule fois (mise en cache) et résout l'URL
 * de l'API selon l'ordre de priorité décrit plus haut.
 * Doit être appelé (et attendu) avant le premier rendu — voir main.jsx.
 */
export function loadConfig() {
  if (loadPromise) return loadPromise;

  // BASE_URL est relatif au dossier de déploiement défini par Vite.
  // Ainsi, config.json reste trouvable si l'application est installée
  // dans un dossier autre que /explorateur/.
  loadPromise = fetch(`${import.meta.env.BASE_URL}config.json`, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`config.json introuvable (HTTP ${res.status})`);
      return res.json();
    })
    .then((json) => {
      const url = json?.api?.baseUrl;
      if (typeof url === "string" && url.trim() !== "") {
        cachedApiUrl = url.replace(/\/+$/, ""); // enlève un éventuel / final
      } else {
        throw new Error("config.json présent mais api.baseUrl est absent/vide");
      }
    })
    .catch((err) => {
      // Pas bloquant : on retombe sur .env puis sur la valeur par défaut,
      // pour que le projet marche même si config.json n'a pas encore
      // été créé (ex: premier `npm run dev` sans avoir copié le modèle).
      console.warn(
        "[config] Impossible de charger /config.json, repli sur VITE_API_URL / valeur par défaut.",
        err.message
      );
      cachedApiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
    });

  return loadPromise;
}

/**
 * Retourne l'URL de base de l'API. Nécessite que loadConfig() ait déjà
 * été résolu (c'est le cas dès que l'app a démarré — voir main.jsx).
 */
export function getApiUrl() {
  if (cachedApiUrl === null) {
    // Filet de sécurité si un composant appelle getApiUrl() trop tôt :
    // on ne bloque jamais l'affichage, on utilise le repli connu.
    console.warn("[config] getApiUrl() appelé avant la fin du chargement de config.json — repli utilisé.");
    return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
  }
  return cachedApiUrl;
}

/** Conservé pour compatibilité avec l'ancien code qui importe { API }. */
export const API = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "L'import `{ API }` de config.js est obsolète. Utilise `api` depuis \"./api/client.js\" (ex: api.login(...)), ou getApiUrl() si tu as vraiment besoin de l'URL brute."
      );
    },
  }
);
