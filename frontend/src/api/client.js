/**
 * Client API centralisé.
 * ------------------------------------------------------------
 * TOUTES les routes du backend PHP sont déclarées ICI, une seule fois.
 * Le reste du frontend n'a plus jamais besoin d'écrire `fetch(...)`
 * ni de connaître un chemin de route : on appelle simplement
 * `api.login(...)`, `api.getFiles(...)`, etc.
 *
 * Avantages :
 *  - Un seul endroit à corriger si une route change de nom côté PHP.
 *  - L'URL de base (config.json) n'est lue qu'ici.
 *  - Gestion d'erreur / JSON uniforme, plus besoin de répéter
 *    `credentials:"include"` ou `try/catch` partout.
 *
 * Exemple d'utilisation dans un composant :
 *   import { api } from "../api/client.js";
 *   const { success, message } = await api.login(username, password);
 */

import { getApiUrl } from "../config.js";

/** Erreur levée quand le backend répond mais avec un souci réseau/HTTP. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Appel JSON générique : préfixe l'URL, envoie les cookies de session,
 * sérialise le body, parse la réponse JSON.
 */
async function request(path, { method = "GET", body, headers, signal } = {}) {
  let res;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError("Serveur injoignable. Vérifie que XAMPP (Apache) est lancé et que l'URL dans config.json est correcte.", 0);
  }

  // Certaines routes (download.php, preview.php...) ne renvoient pas du JSON ;
  // elles sont appelées via des URLs directes (voir buildUrl ci-dessous),
  // pas via request(). Ici on suppose toujours du JSON.
  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(`Réponse invalide du serveur (HTTP ${res.status}).`, res.status);
  }
  return data;
}

/** Construit une URL absolue vers une route (pour <a href>, window.open, <img src>...). */
function buildUrl(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ).toString();
  return `${getApiUrl()}${path}${qs ? `?${qs}` : ""}`;
}

/** Upload avec suivi de progression (XHR, car fetch ne l'expose pas facilement). */
function uploadWithProgress(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("path", path);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => resolve();
    xhr.onerror = () => reject(new ApiError("Échec de l'upload (réseau).", 0));
    xhr.open("POST", buildUrl("/upload.php"));
    xhr.withCredentials = true;
    xhr.send(fd);
  });
}

export const api = {
  /* ── Auth ── */
  login: (username, password) => request("/login.php", { method: "POST", body: { username, password } }),
  register: (username, email, password) => request("/register.php", { method: "POST", body: { username, email, password } }),
  logout: () => request("/logout.php", { method: "POST" }),
  me: () => request("/me.php"),

  /* ── Fichiers ── */
  getFiles: (path) => request(`/files.php?path=${encodeURIComponent(path)}`),
  search: (query) => request(`/search.php?q=${encodeURIComponent(query)}`),
  readFile: (path) => request(`/read_file.php?path=${encodeURIComponent(path)}`),
  saveFile: (path, content) => request("/save_file.php", { method: "POST", body: { path, content } }),
  createFolder: (name, path) => request("/create_folder.php", { method: "POST", body: { name, path } }),
  createFile: (name, path) => request("/create_file.php", { method: "POST", body: { name, path } }),
  rename: (oldName, newName, path) => request("/rename.php", { method: "POST", body: { oldName, newName, path } }),
  paste: (files, targetPath, mode) => request("/paste.php", { method: "POST", body: { files, targetPath, mode } }),
  deleteFile: (file, path) => request("/delete.php", { method: "POST", body: { file, path } }),
  deleteMultiple: (files, path) => request("/delete_multiple.php", { method: "POST", body: { files, path } }),

  /* ── Upload ── */
  upload: uploadWithProgress,

  /* ── Téléchargement / prévisualisation (liens directs, pas du JSON) ── */
  downloadUrl: (path, file) => buildUrl("/download.php", { path, file }),
  previewUrl: (path) => buildUrl("/preview.php", { path }),
  downloadZip: async (files) => {
    const res = await fetch(buildUrl("/download_zip.php"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
    if (!res.ok) throw new ApiError("Échec du téléchargement ZIP.", res.status);
    return res.blob();
  },

  /* ── Versions ── */
  listVersions: (file, path) => request("/versions.php", { method: "POST", body: { file, path } }),
  restoreVersion: (versionPath, targetPath) =>
    request("/restore_version.php", { method: "POST", body: { versionPath, targetPath } }),

  /* ── Corbeille ── */
  trashList: () => request("/trash_list.php"),
  trashRestore: (payload) =>
    request(`/trash_restore.php${payload.id ? `?id=${payload.id}` : ""}`, { method: "POST", body: payload }),
  trashDelete: (payload) =>
    request(`/trash_delete.php${payload.id ? `?id=${payload.id}` : ""}`, { method: "POST", body: payload }),

  /* ── Tableau de bord & logs ── */
  dashboard: () => request("/dashboard.php"),
  logs: () => request("/logs.php"),

  /* ── Administration ── */
  admin: {
    summary: () => request("/admin_summary.php"),
    createUser: (user) => request("/admin_create_user.php", { method: "POST", body: user }),
    approveUser: (id, extra = {}) => request("/admin_approve_user.php", { method: "POST", body: { id, ...extra } }),
    setRole: (id, role) => request("/admin_approve_user.php", { method: "POST", body: { id, role } }),
    setBlocked: (id, blocked) =>
      request("/admin_approve_user.php", { method: "POST", body: { id, status: blocked ? "blocked" : "active" } }),
    deleteUser: (id) => request("/admin_delete_user.php", { method: "POST", body: { id } }),
  },
};
