import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import { Icon, getFileIcon, getIconColor } from "./icons.jsx";
import { api } from "./api/client.js";

/* ── Hook thème ── */
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("ef-theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ef-theme", theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === "light" ? "dark" : "light");
  return [theme, toggle];
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "—";
  const units = ["o","Ko","Mo","Go","To"];
  let i = 0, s = bytes;
  while (s >= 1024 && i < units.length - 1) { s /= 1024; i++; }
  return `${s.toFixed(1)} ${units[i]}`;
};

const formatDate = (ts) => {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("fr-FR", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
};

const IMAGE_EXTS = ["png","jpg","jpeg","gif","webp","svg"];
const isImageFile = (item) => {
  if (item.type === "folder") return false;
  const ext = item.name.split(".").pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
};

const getFileTypeLabel = (item) => {
  if (item.type === "folder") return "Dossier";
  const ext = item.name.split(".").pop().toLowerCase();
  const map = {
    pdf:"PDF", png:"Image", jpg:"Image", jpeg:"Image", gif:"Image", webp:"Image",
    svg:"Image", txt:"Texte", md:"Markdown", zip:"Archive", rar:"Archive",
    "7z":"Archive", doc:"Word", docx:"Word", xls:"Excel", xlsx:"Excel",
    csv:"CSV", ppt:"PowerPoint", pptx:"PowerPoint", mp3:"Audio", wav:"Audio",
    ogg:"Audio", mp4:"Vidéo", avi:"Vidéo", mkv:"Vidéo", mov:"Vidéo"
  };
  return map[ext] ?? ext.toUpperCase();
};

/* ─────────────────────────────────────────────
   MINI-COMPOSANTS UI
───────────────────────────────────────────── */

/* Modal générique */
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer">
            <Icon name="close" size={16}/>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* Modale de saisie (remplace prompt()) */
function PromptModal({ title, label, placeholder, defaultValue = "", onConfirm, onClose }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal prompt-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="modal-body">
          <label style={{fontSize:13,fontWeight:600,color:"#334155"}}>{label}</label>
          <input
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && value.trim()) onConfirm(value.trim()); if (e.key === "Escape") onClose(); }}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => value.trim() && onConfirm(value.trim())}>
            <Icon name="check" size={14}/> Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

/* Modale de confirmation (remplace confirm()) */
function ConfirmModal({ title, message, confirmLabel = "Confirmer", danger = false, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="modal-body">
          <p style={{margin:0,fontSize:14,color:"#475569"}}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            {danger ? <Icon name="trash" size={14}/> : <Icon name="check" size={14}/>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP PRINCIPALE
───────────────────────────────────────────── */
function App() {
  const [theme, toggleTheme] = useTheme();

  /* Admin panel */
  const [showAdmin,     setShowAdmin]     = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  /* Auth */
  const [connected,    setConnected]    = useState(false);
  const [loadingAuth,  setLoadingAuth]  = useState(true);
  const [userRole,     setUserRole]     = useState(null);
  const [username,     setUsername]     = useState("");

  /* Fichiers */
  const [files,        setFiles]        = useState([]);
  const [currentPath,  setCurrentPath]  = useState(".");
  const [error,        setError]        = useState("");

  /* Recherche */
  const [search,       setSearch]       = useState("");
  const [searchMode,   setSearchMode]   = useState("local");

  /* Sélection */
  const [selectedItems,     setSelectedItems]     = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  /* Clipboard */
  const [clipboard,     setClipboard]     = useState([]);
  const [clipboardMode, setClipboardMode] = useState(null);

  /* Drag & drop */
  const [draggedItem,       setDraggedItem]       = useState(null);
  const [isDraggingExternal,setIsDraggingExternal]= useState(false);

  /* Renommage inline */
  const [editingItem, setEditingItem] = useState(null);
  const [newName,     setNewName]     = useState("");
  const [isRenaming,  setIsRenaming]  = useState(false);

  /* Upload */
  const [uploadingFiles, setUploadingFiles] = useState([]);

  /* Preview */
  const [previewFile,  setPreviewFile]  = useState(null);

  /* Versions */
  const [versions,     setVersions]     = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versionItem,  setVersionItem]  = useState(null);

  /* Text editor */
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [textFilePath,   setTextFilePath]   = useState(null);
  const [textContent,    setTextContent]    = useState("");
  const [savingText,     setSavingText]     = useState(false);

  /* Tri */
  const [sortBy,    setSortBy]    = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  /* Toast */
  const [toast, setToast] = useState(null);

  /* Modales custom */
  const [promptModal,  setPromptModal]  = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  /* Vue liste / grille */
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("ef-view") || "list");
  const switchView = (mode) => { setViewMode(mode); localStorage.setItem("ef-view", mode); };

  /* Click timeout (simple vs double) */
  const [clickTimeout, setClickTimeout] = useState(null);

  /* ── Helpers ── */
  const showToast = useCallback((message, type = "info", duration = 2800) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  /* ── API ── */
  const fetchFiles = useCallback(async (path = currentPath) => {
    try {
      const data = await api.getFiles(path);
      if (data.error) { setError(data.error); setFiles([]); return; }
      setFiles(data); setError(""); setSelectedItems([]);
    } catch { setError("Erreur chargement des fichiers"); }
  }, [currentPath]);

  /* ── Auth ── */
  useEffect(() => {
    (async () => {
      try {
        const data = await api.me();
        if (data.connected) { setConnected(true); setUserRole(data.role); setUsername(data.username); }
        else setConnected(false);
      } catch { setConnected(false); }
      finally { setLoadingAuth(false); }
    })();
  }, []);

  // L'effet ne doit se lancer qu'à la connexion : fetchFiles change avec le dossier courant.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (connected) fetchFiles("."); }, [connected]);

  /* ── Context menu close ── */
  const [contextMenu, setContextMenu] = useState(null);
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ── Rôles — déclarés tôt, avant tout useEffect qui les utilise ── */
  const isAdmin   = userRole === "admin";
  const isEditeur = userRole === "admin" || userRole === "editeur";

  /* ── Refs pour raccourcis clavier ── */
  const sortedFilesRef = useRef([]);
  const actionsRef     = useRef({});

  /* Mise à jour des refs après chaque render — useLayoutEffect évite les effets pendant le rendu */
  useEffect(() => {
    sortedFilesRef.current = sortedFiles;
    actionsRef.current = {
      copyFiles, cutFiles, pasteFiles, deleteSelected,
      fetchFiles, createFolder, goBack, handleDoubleClick, showToast,
      selectedItems, clipboard, currentPath, editingItem,
      confirmModal, promptModal, textEditorOpen, previewFile,
      showVersions, showAdmin, contextMenu, isEditeur,
    };
  });

  useEffect(() => {
    const handler = (e) => {
      const a = actionsRef.current;
      const sf = sortedFilesRef.current;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "Escape") {
        if (a.confirmModal)   { setConfirmModal(null);    return; }
        if (a.promptModal)    { setPromptModal(null);     return; }
        if (a.textEditorOpen) { setTextEditorOpen(false); return; }
        if (a.previewFile)    { setPreviewFile(null);     return; }
        if (a.showVersions)   { setShowVersions(false);   return; }
        if (a.showAdmin)      { setShowAdmin(false);      return; }
        if (a.contextMenu)    { setContextMenu(null);     return; }
        if (a.editingItem)    { setEditingItem(null); setNewName(""); return; }
        setSelectedItems([]);
        return;
      }
      if (inInput) return;
      if (a.confirmModal || a.promptModal || a.textEditorOpen || a.previewFile || a.showVersions || a.showAdmin) return;

      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "c" && a.selectedItems.length && a.currentPath !== "CORBEILLE") { e.preventDefault(); a.copyFiles(); return; }
      if (ctrl && e.key === "x" && a.selectedItems.length && a.currentPath !== "CORBEILLE") { e.preventDefault(); a.cutFiles(); return; }
      if (ctrl && e.key === "v" && a.clipboard.length && a.currentPath !== "CORBEILLE")     { e.preventDefault(); a.pasteFiles(); return; }
      if (ctrl && e.key === "a") { e.preventDefault(); setSelectedItems(sf.map(f => ({ name:f.name, path:a.currentPath, type:f.type }))); return; }
      if (e.key === "Delete" && a.selectedItems.length && a.isEditeur && a.currentPath !== "CORBEILLE") { e.preventDefault(); a.deleteSelected(); return; }
      if (e.key === "F2" && a.selectedItems.length === 1 && a.isEditeur && a.currentPath !== "CORBEILLE") {
        e.preventDefault(); setEditingItem(a.selectedItems[0].name); setNewName(a.selectedItems[0].name); return;
      }
      if (e.key === "Enter" && a.selectedItems.length === 1 && !a.editingItem) {
        e.preventDefault();
        const item = sf.find(f => f.name === a.selectedItems[0].name);
        if (item) a.handleDoubleClick(item); return;
      }
      if (e.altKey && e.key === "ArrowLeft" && a.currentPath !== "." && a.currentPath !== "CORBEILLE") { e.preventDefault(); a.goBack(); return; }
      if (e.key === "F5" || (ctrl && e.key === "r")) { e.preventDefault(); a.fetchFiles(); a.showToast("Dossier actualisé", "info"); return; }
      if (ctrl && e.key === "f") { e.preventDefault(); document.querySelector(".search-bar input")?.focus(); return; }
      if (ctrl && e.shiftKey && e.key === "N" && a.isEditeur && a.currentPath !== "CORBEILLE") { e.preventDefault(); a.createFolder(); return; }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && sf.length) {
        e.preventDefault();
        if (!a.selectedItems.length) { setSelectedItems([{ name:sf[0].name, path:a.currentPath, type:sf[0].type }]); setLastSelectedIndex(0); return; }
        const ci = sf.findIndex(f => f.name === a.selectedItems[a.selectedItems.length-1]?.name);
        const ni = e.key === "ArrowDown" ? Math.min(ci+1, sf.length-1) : Math.max(ci-1, 0);
        const next = sf[ni];
        if (e.shiftKey) {
          setSelectedItems(prev => prev.some(i => i.name === next.name) ? prev.filter(i => i.name !== next.name) : [...prev, {name:next.name, path:a.currentPath, type:next.type}]);
        } else { setSelectedItems([{name:next.name, path:a.currentPath, type:next.type}]); }
        setLastSelectedIndex(ni);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // [] — lit l'état courant via actionsRef, pas de re-subscribe

  /* ── Paste from clipboard (OS) — éditeur + admin seulement ── */
  useEffect(() => {
    const handlePaste = (e) => {
      if (currentPath === "CORBEILLE") return;
      if (!isEditeur) return; // lecteurs ne peuvent pas uploader
      const items = e.clipboardData?.items;
      if (!items) return;
      const toUpload = [];
      for (let i = 0; i < items.length; i++)
        if (items[i].kind === "file") { const f = items[i].getAsFile(); if (f) toUpload.push(f); }
      if (toUpload.length) { uploadMultipleFiles(toUpload); showToast("Fichier(s) collé(s)", "success"); }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  // Les valeurs dynamiques nécessaires sont couvertes par currentPath/isEditeur.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, isEditeur]);

  /* ── Global search ── */
  useEffect(() => {
    if (searchMode !== "global" || !search.trim()) return;
    (async () => {
      try {
        const data = await api.search(search);
        setFiles(data);
      } catch { showToast("Erreur recherche globale", "error"); }
    })();
  // showToast est stable ; éviter de relancer une recherche à cause de son identité.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchMode]);

  /* ── Navigation ── */
  const logout = async () => {
    await api.logout();
    setConnected(false); setUserRole(null); setUsername("");
  };

  const pathParts = currentPath === "." ? [] : currentPath.split("/");

  const goTo = (path) => { setCurrentPath(path); fetchFiles(path); };

  const openFolder = (name) => {
    if (currentPath === "CORBEILLE") return;
    const np = currentPath === "." ? name : `${currentPath}/${name}`;
    goTo(np);
  };

  const goBack = () => {
    if (currentPath === "." || currentPath === "CORBEILLE") return;
    const parts = currentPath.split("/"); parts.pop();
    goTo(parts.length ? parts.join("/") : ".");
  };

  const goToBreadcrumb = (index) => {
    if (currentPath === "CORBEILLE") return;
    goTo(pathParts.slice(0, index + 1).join("/") || ".");
  };

  /* ── Sélection ── */
  const displayedFiles = searchMode === "local"
    ? files.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const handleSelect = (item, index, e) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end   = Math.max(lastSelectedIndex, index);
      setSelectedItems(displayedFiles.slice(start, end + 1).map(f => ({ name:f.name, path:currentPath, type:f.type })));
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      const already = selectedItems.some(i => i.name === item.name);
      setSelectedItems(already
        ? selectedItems.filter(i => i.name !== item.name)
        : [...selectedItems, { name:item.name, path:currentPath, type:item.type }]);
      setLastSelectedIndex(index);
      return;
    }
    setSelectedItems([{ name:item.name, path:currentPath, type:item.type }]);
    setLastSelectedIndex(index);
  };

  /* ── Tri ── */
  const handleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const sortedFiles = [...displayedFiles].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    let va = "", vb = "";
    if (sortBy === "name") { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
    if (sortBy === "type") { va = a.type;                vb = b.type; }
    if (va < vb) return sortOrder === "asc" ? -1 : 1;
    if (va > vb) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  /* ── Highlight ── */
  const highlight = (text) => {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "ig");
    return text.split(regex).map((p, i) =>
      p.toLowerCase() === search.toLowerCase() ? <mark key={i}>{p}</mark> : p
    );
  };

  /* ── Upload ── */
  const uploadFileWithProgress = (file, path) => {
    const id = Date.now() + file.name;
    setUploadingFiles(prev => [...prev, { id, name:file.name, progress:0 }]);
    return api.upload(file, path, (pct) => {
      setUploadingFiles(prev => prev.map(f => f.id === id ? {...f, progress:pct} : f));
    }).finally(() => {
      setTimeout(() => setUploadingFiles(prev => prev.filter(f => f.id !== id)), 800);
    });
  };

  const uploadMultipleFiles = async (files) => {
    for (const f of Array.from(files)) {
      try { await uploadFileWithProgress(f, currentPath); }
      catch { showToast(`Erreur upload : ${f.name}`, "error"); }
    }
    showToast("Upload terminé", "success");
    fetchFiles();
  };

  const processEntry = async (entry, relativePath = "") => {
    if (entry.isFile) {
      await new Promise(res => entry.file(async f => {
        try { await uploadFileWithProgress(f, currentPath + "/" + relativePath); } catch { /* échec individuel déjà signalé par la barre de progression */ }
        res();
      }));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      await new Promise(res => reader.readEntries(async entries => {
        for (const e of entries) await processEntry(e, relativePath + entry.name + "/");
        res();
      }));
    }
  };

  /* ── CRUD ── */
  const deleteFile = (name) => {
    setConfirmModal({
      title: "Supprimer",
      message: `Supprimer "${name}" ?`,
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const data = await api.deleteFile(name, currentPath);
          if (data.success) { showToast("Supprimé", "success"); fetchFiles(); }
          else showToast(data.message, "error");
        } catch { showToast("Erreur réseau", "error"); }
      }
    });
  };

  const deleteSelected = useCallback(() => {
    if (!selectedItems.length) return;
    setConfirmModal({
      title: "Supprimer la sélection",
      message: `Supprimer ${selectedItems.length} élément(s) ?`,
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const data = await api.deleteMultiple(selectedItems.map(f => f.name), currentPath);
          if (data.success) { showToast("Suppression effectuée", "success"); fetchFiles(); setSelectedItems([]); }
          else showToast(data.message, "error");
        } catch { showToast("Erreur réseau", "error"); }
      }
    });
  }, [selectedItems, currentPath, fetchFiles, showToast]);

  const renameItem = async (oldName) => {
    if (!newName.trim()) return;
    setIsRenaming(true);
    try {
      const data = await api.rename(oldName, newName, currentPath);
      if (data.success) { showToast("Renommé", "success"); setEditingItem(null); setNewName(""); fetchFiles(); }
      else showToast(data.message, "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setIsRenaming(false); }
  };

  /* ── Clipboard ── */
  const copyFiles = useCallback(() => {
    if (!selectedItems.length) return;
    setClipboard(selectedItems); setClipboardMode("copy");
    showToast(`${selectedItems.length} élément(s) copié(s)`, "info");
  }, [selectedItems, showToast]);

  const cutFiles = useCallback(() => {
    if (!selectedItems.length) return;
    setClipboard(selectedItems); setClipboardMode("cut");
    showToast(`${selectedItems.length} élément(s) prêts à déplacer`, "info");
  }, [selectedItems, showToast]);

  const pasteFiles = useCallback(async () => {
    if (!clipboard.length) return;
    try {
      const data = await api.paste(clipboard, currentPath, clipboardMode);
      if (data.success) {
        showToast(clipboardMode === "cut" ? "Déplacé" : "Copié", "success");
        setClipboard([]); setClipboardMode(null); fetchFiles();
      } else showToast(data.message, "error");
    } catch { showToast("Erreur réseau", "error"); }
  }, [clipboard, clipboardMode, currentPath, fetchFiles, showToast]);

  /* ── Drag & drop interne ── */
  const handleDragStart = (item) => setDraggedItem({ name:item.name, path:currentPath, type:item.type });
  const handleDrop = async (targetFolder) => {
    if (!draggedItem || targetFolder.type !== "folder") return;
    if (draggedItem.name === targetFolder.name && draggedItem.path === currentPath) return;
    const targetPath = currentPath === "." ? targetFolder.name : `${currentPath}/${targetFolder.name}`;
    try {
      const data = await api.paste([draggedItem], targetPath, "cut");
      if (data.success) { showToast("Déplacé", "success"); fetchFiles(); }
      else showToast(data.message, "error");
    } catch { showToast("Erreur drag & drop", "error"); }
    finally { setDraggedItem(null); }
  };

  /* ── Ouvrir ── */
  const openTextEditor = async (item) => {
    const fullPath = currentPath === "." ? item.name : `${currentPath}/${item.name}`;
    try {
      const data = await api.readFile(fullPath);
      if (!data.success) { showToast(data.message, "error"); return; }
      setTextFilePath(fullPath); setTextContent(data.content); setTextEditorOpen(true);
    } catch { showToast("Erreur ouverture", "error"); }
  };

  const saveTextFile = async () => {
    if (!textFilePath) return;
    setSavingText(true);
    try {
      const data = await api.saveFile(textFilePath, textContent);
      if (data.success) { showToast("Sauvegardé", "success"); setTextEditorOpen(false); fetchFiles(); }
      else showToast(data.message, "error");
    } catch { showToast("Erreur sauvegarde", "error"); }
    finally { setSavingText(false); }
  };

  const PREVIEWABLE = ["pdf","png","jpg","jpeg","gif","webp","mp4","webm","mp3","ogg","wav","txt","md"];
  const openPreview = (item) => {
    if (item.type === "folder") return;
    const ext = item.name.split(".").pop().toLowerCase();
    if (!PREVIEWABLE.includes(ext)) {
      showToast(`Prévisualisation non disponible pour .${ext}`, "info"); return;
    }
    const fullPath = currentPath === "." ? item.name : `${currentPath}/${item.name}`;
    setPreviewFile(fullPath);
  };

  const handleDoubleClick = (item) => {
    if (editingItem === item.name) return;
    if (currentPath === "CORBEILLE") { showToast("Impossible d'ouvrir depuis la corbeille", "info"); return; }
    if (item.type === "folder") { openFolder(item.name); return; }
    const ext = item.name.split(".").pop().toLowerCase();
    if (ext === "txt") openTextEditor(item);
    else openPreview(item);
  };

  /* ── Versions ── */
  const handleVersions = async (item) => {
    if (item.type === "folder") { showToast("Un dossier n'a pas de versions", "info"); return; }
    try {
      const data = await api.listVersions(item.name, currentPath);
      if (!data.success) { showToast(data.message, "error"); return; }
      setVersions(data.versions); setVersionItem(item); setShowVersions(true);
    } catch { showToast("Erreur versions", "error"); }
  };

  /* ── Création ── */
  const createFolder = useCallback(() => {
    setPromptModal({
      title: "Nouveau dossier",
      label: "Nom du dossier",
      placeholder: "ex : Documents",
      onConfirm: async (name) => {
        setPromptModal(null);
        try {
          const data = await api.createFolder(name, currentPath);
          if (data.success) { showToast("Dossier créé", "success"); fetchFiles(); }
          else showToast(data.message, "error");
        } catch { showToast("Erreur création dossier", "error"); }
      }
    });
  }, [currentPath, fetchFiles, showToast]);

  const createFile = () => {
    setPromptModal({
      title: "Nouveau fichier",
      label: "Nom du fichier",
      placeholder: "ex : notes.txt",
      onConfirm: async (name) => {
        setPromptModal(null);
        try {
          const data = await api.createFile(name, currentPath);
          if (data.success) { showToast("Fichier créé", "success"); fetchFiles(); }
          else showToast(data.message, "error");
        } catch { showToast("Erreur création fichier", "error"); }
      }
    });
  };

  /* ── Corbeille ── */
  const openTrash = async () => {
    try {
      const data = await api.trashList();
      if (data.success) {
        setSearch("");
        setSearchMode("local");
        setSelectedItems([]);
        setFiles(Array.isArray(data.files) ? data.files : []);
        setCurrentPath("CORBEILLE");
        showToast("Corbeille ouverte", "info");
      } else {
        showToast(data.message || "Erreur chargement corbeille", "error");
      }
    } catch { showToast("Erreur chargement corbeille", "error"); }
  };

  const trashPayload = (item) => ({
    id: Number(item?.id) || 0,
    file: item?.name || "",
    name: item?.name || "",
    trash_name: item?.trash_name || "",
  });

  const restoreFromTrash = async (item) => {
    const payload = trashPayload(item);
    if (!payload.id && !payload.file && !payload.trash_name) {
      showToast("Élément corbeille invalide", "error");
      return;
    }
    try {
      const data = await api.trashRestore(payload);
      if (data.success) {
        showToast("Restauré", "success");
        const d = await api.trashList();
        if (d.success) setFiles(d.files);
      } else showToast(data.message || "Erreur restauration", "error");
    } catch {
      showToast("Erreur restauration", "error");
    }
  };

  const deleteFromTrash = (item) => {
    const payload = trashPayload(item);
    if (!payload.id && !payload.file && !payload.trash_name) {
      showToast("Élément corbeille invalide", "error");
      return;
    }
    setConfirmModal({
      title: "Supprimer définitivement",
      message: `"${item.name}" sera supprimé de façon permanente.`,
      confirmLabel: "Supprimer définitivement",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const data = await api.trashDelete(payload);
          if (data.success) {
            showToast("Supprimé définitivement", "success");
            const d = await api.trashList();
            if (d.success) setFiles(d.files);
          } else showToast(data.message || "Erreur suppression", "error");
        } catch {
          showToast("Erreur suppression", "error");
        }
      }
    });
  };

  /* ── KPIs ── */
  const folderCount  = files.filter(i => i.type === "folder").length;
  const fileCount    = files.filter(i => i.type === "file").length;
  const selectedCount = selectedItems.length;
  const sortLabel    = `${sortBy} ${sortOrder === "asc" ? "↑" : "↓"}`;

  /* ── Guards ── */
  if (loadingAuth) return (
    <div className="loading-screen">
      <div className="spinner"/>
      <span>Vérification de la session…</span>
    </div>
  );

  if (!connected) return (
    <AuthPage onLoginSuccess={(user) => {
      setConnected(true); setUserRole(user.role); setUsername(user.username);
      setShowDashboard(true);
    }}/>
  );

  /* ── Dashboard d'accueil ── */
  if (showDashboard) return (
    <Dashboard
      username={username}
      role={userRole}
      onEnter={() => setShowDashboard(false)}
    />
  );

  /* ═══════════════════════════════════════════
     RENDU PRINCIPAL
  ═══════════════════════════════════════════ */
  return (
    <div
      className="app-container"
      onClick={e => { if (e.target.tagName === "DIV" && !e.target.closest("li")) { setSelectedItems([]); setLastSelectedIndex(null); }}}
    >

      {/* ── HEADER ── */}
      <div className="header">
        <div className="header-brand">
          <div className="brand-mark">EM</div>
          <div className="header-title">
            <p className="eyebrow">EMM'S Files</p>
            <h2>EMM'S Files</h2>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDashboard(true)} title="Tableau de bord">
            <Icon name="home" size={14}/> Accueil
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Changer de thème">
            {theme === "light"
              ? <><Icon name="eye" size={14}/> Thème sombre</>
              : <><Icon name="eye" size={14}/> Thème clair</>
            }
          </button>
          {isAdmin && (
            <button className="btn btn-ghost btn-sm" style={{gap:6}} onClick={openTrash}>
              <Icon name="trash_open" size={14}/> Corbeille
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-sm" onClick={() => setShowAdmin(true)}>
              <Icon name="admin" size={14}/> Administration
            </button>
          )}
          <div className="user-chip">
            <span className="chip-name">{username || "Utilisateur"}</span>
            <span className="chip-role">{isAdmin ? "Administrateur" : userRole === "editeur" ? "Éditeur" : "Lecteur"}</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={logout}>
            <Icon name="logout" size={14}/> Déconnexion
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dashboard-strip">
        {[
          ["Dossiers",    folderCount],
          ["Fichiers",    fileCount],
          ["Sélection",   selectedCount],
          ["Tri actif",   sortLabel],
        ].map(([label, value]) => (
          <div className="kpi-card" key={label}>
            <span className="kpi-label">{label}</span>
            <strong className="kpi-value">{value}</strong>
          </div>
        ))}
      </div>

      {/* ── CORBEILLE BANNER ── */}
      {currentPath === "CORBEILLE" && (
        <div className="trash-banner">
          <Icon name="trash_open" size={16}/>
          Vous consultez la corbeille — les fichiers ici peuvent être restaurés ou supprimés définitivement.
          <button className="btn btn-sm" style={{marginLeft:"auto"}} onClick={() => goTo(".")}>
            <Icon name="back" size={12}/> Quitter la corbeille
          </button>
        </div>
      )}

      {/* ── TOOLBAR (breadcrumb + nav) ── */}
      <div className="toolbar">
        {currentPath !== "." && currentPath !== "CORBEILLE" && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={goBack} title="Dossier parent">
            <Icon name="back" size={15}/>
          </button>
        )}

        <div className="view-toggle" style={{marginLeft:"auto"}} title="Changer la vue">
          <button
            className={`view-toggle-btn${viewMode === "list" ? " active" : ""}`}
            onClick={() => switchView("list")}
            title="Vue liste"
          >
            <Icon name="list" size={15}/>
          </button>
          <button
            className={`view-toggle-btn${viewMode === "grid" ? " active" : ""}`}
            onClick={() => switchView("grid")}
            title="Vue grille"
          >
            <Icon name="grid" size={15}/>
          </button>
        </div>

        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <span
            className="breadcrumb-root"
            onClick={() => { if (currentPath === "CORBEILLE") return; goTo("."); }}
          >
            <Icon name="home" size={13}/> Racine
          </span>

          {pathParts.map((part, i) => (
            <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4}}>
              <Icon name="chevron_right" size={12} className="breadcrumb-sep"/>
              {i === pathParts.length - 1
                ? <span className="breadcrumb-current">{part}</span>
                : <span className="breadcrumb-part" onClick={() => goToBreadcrumb(i)}>{part}</span>
              }
            </span>
          ))}

          {currentPath === "CORBEILLE" && (
            <>
              <Icon name="chevron_right" size={12} className="breadcrumb-sep"/>
              <span className="breadcrumb-current" style={{color:"var(--danger)"}}>
                <Icon name="trash" size={12}/> Corbeille
              </span>
            </>
          )}
        </nav>
      </div>

      {/* ── SEARCH ── */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <Icon name="search" size={15} className="search-icon"/>
          <input
            placeholder="Rechercher un nom ou une extension (.pdf, .txt…)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={searchMode} onChange={e => setSearchMode(e.target.value)}>
          <option value="local">Dossier courant</option>
          <option value="global">Recherche globale</option>
        </select>
      </div>

      {/* ── ACTION BAR ── */}
      {isEditeur && (
        <div className="action-bar">
          <span className="action-bar-label">
            Sélection <span>{selectedCount}</span>
          </span>

          {/* Groupe presse-papiers */}
          <div className="btn-group">
            <button className="btn btn-sm" onClick={copyFiles} disabled={!selectedCount || currentPath === "CORBEILLE"} title="Copier">
              <Icon name="copy" size={13}/> Copier
            </button>
            <button className="btn btn-sm" onClick={cutFiles}  disabled={!selectedCount || currentPath === "CORBEILLE"} title="Couper">
              <Icon name="cut" size={13}/> Couper
            </button>
            <button className="btn btn-sm" onClick={pasteFiles} disabled={!clipboard.length || currentPath === "CORBEILLE"} title="Coller">
              <Icon name="paste" size={13}/> Coller
            </button>
          </div>

          <div className="btn-group-sep"/>

          {/* Groupe création */}
          <div className="btn-group">
            <button className="btn btn-sm" onClick={createFolder} disabled={currentPath === "CORBEILLE"}>
              <Icon name="folder_new" size={13}/> Nouveau dossier
            </button>
            <button className="btn btn-sm" onClick={createFile} disabled={currentPath === "CORBEILLE"}>
              <Icon name="file_new" size={13}/> Nouveau fichier
            </button>
          </div>

          <div className="btn-group-sep"/>

          {/* Groupe actions sur sélection */}
          <div className="btn-group">
            <button
              className="btn btn-sm"
              disabled={!selectedCount}
              onClick={async () => {
                const blob = await api.downloadZip(selectedItems);
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a");
                a.href = url; a.download = "download.zip"; a.click();
                URL.revokeObjectURL(url);
                showToast("Téléchargement ZIP lancé", "success");
              }}
            >
              <Icon name="download" size={13}/> ZIP
            </button>
            <button className="btn btn-danger btn-sm" onClick={deleteSelected} disabled={!selectedCount}>
              <Icon name="trash" size={13}/> Supprimer
            </button>
          </div>
        </div>
      )}

      {/* ── UPLOAD ZONE — éditeur + admin seulement ── */}
      {currentPath !== "CORBEILLE" && isEditeur && (
        <div
          className="upload-zone"
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
          onDragEnter={e => { e.preventDefault(); setIsDraggingExternal(true); }}
          onDragLeave={() => setIsDraggingExternal(false)}
          onDrop={async e => {
            e.preventDefault(); setIsDraggingExternal(false);
            const items = e.dataTransfer.items;
            if (!items || items.length === 0) return;
            for (let i = 0; i < items.length; i++) {
              const entry = items[i].webkitGetAsEntry();
              if (entry) await processEntry(entry);
            }
            showToast("Upload terminé", "success"); fetchFiles();
          }}
        >
          <Icon name="upload" size={18} style={{color:"var(--primary)"}}/>
          <label>
            <input
              type="file"
              webKitdirectory directory multiple
              onChange={e => uploadMultipleFiles(e.target.files)}
            />
            <Icon name="upload" size={14}/> Choisir des fichiers
          </label>
          <span style={{color:"var(--muted)"}}>ou glissez-déposez ici — dossiers acceptés</span>
        </div>
      )}

      {/* ── BANNIÈRE LECTEUR ── */}
      {!isEditeur && currentPath !== "CORBEILLE" && (
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"10px 16px", marginBottom:10,
          border:"1px solid var(--line)", borderRadius:"var(--radius)",
          background:"var(--surface-soft)", color:"var(--muted)", fontSize:13,
        }}>
          <Icon name="eye" size={15}/>
          <span>Mode <strong style={{color:"var(--text)"}}>Lecteur</strong> — vous pouvez consulter et télécharger les fichiers.</span>
        </div>
      )}

      {/* ── UPLOAD PROGRESS ── */}
      {uploadingFiles.map(f => (
        <div key={f.id} className="upload-progress-item">
          <span><Icon name="upload" size={13}/> {f.name}</span>
          <div className="progress-bar"><div className="progress-fill" style={{width: f.progress + "%"}}/></div>
          <span className="progress-pct">{f.progress}%</span>
        </div>
      ))}

      {/* ── TABLE HEADER (liste seulement) ── */}
      {viewMode === "list" && (
      <div className="table-header">
        <div/>
        <div className="th-sortable" onClick={() => handleSort("name")}>
          Nom {sortBy === "name" && <span className="sort-arrow">{sortOrder === "asc" ? "↑" : "↓"}</span>}
        </div>
        <div className="th-sortable" onClick={() => handleSort("type")}>
          Type {sortBy === "type" && <span className="sort-arrow">{sortOrder === "asc" ? "↑" : "↓"}</span>}
        </div>
        <div>Taille</div>
        <div>Modifié</div>
        <div style={{textAlign:"right"}}>Actions</div>
      </div>
      )}

      {/* ── VUE GRILLE ── */}
      {viewMode === "grid" && (
        <div className="file-grid">
          {sortedFiles.length === 0 && (
            <div className="empty-state" style={{gridColumn:"1/-1"}}>
              <Icon name={currentPath === "CORBEILLE" ? "trash" : "folder"} size={42}/>
              <p>{currentPath === "CORBEILLE" ? "La corbeille est vide" : "Ce dossier est vide"}</p>
            </div>
          )}
          {sortedFiles.map((item, index) => {
            const isSelected = selectedItems.some(i => i.name === item.name && i.path === currentPath);
            const iconName   = getFileIcon(item);
            const iconColor  = getIconColor(item);
            return (
              <div
                key={item.name}
                className={`grid-card${isSelected ? " selected" : ""}`}
                draggable
                onDragStart={() => handleDragStart(item)}
                onDragOver={item.type === "folder" ? e => e.preventDefault() : undefined}
                onDrop={item.type === "folder" ? () => handleDrop(item) : undefined}
                onClick={e => {
                  if (clickTimeout) clearTimeout(clickTimeout);
                  const t = setTimeout(() => handleSelect(item, index, e), 200);
                  setClickTimeout(t);
                }}
                onDoubleClick={e => { e.stopPropagation(); if (clickTimeout) clearTimeout(clickTimeout); handleDoubleClick(item); }}
                onContextMenu={e => {
                  e.preventDefault(); e.stopPropagation();
                  if (!selectedItems.some(i => i.name === item.name))
                    setSelectedItems([{ name:item.name, path:currentPath, type:item.type }]);
                  setContextMenu({ x:e.clientX, y:e.clientY, item });
                }}
                title={item.name}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="grid-card-check"
                  checked={isSelected}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    if (e.target.checked) setSelectedItems(prev => [...prev, { name:item.name, path:currentPath, type:item.type }]);
                    else setSelectedItems(prev => prev.filter(i => i.name !== item.name));
                  }}
                />

                {/* Actions rapides au survol */}
                <div className="grid-card-actions" onClick={e => e.stopPropagation()}>
                  {currentPath === "CORBEILLE" ? (
                    <>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => restoreFromTrash(item)} title="Restaurer">
                        <Icon name="restore" size={12}/>
                      </button>
                      {isAdmin && (
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteFromTrash(item)} title="Supprimer définitivement">
                          <Icon name="trash" size={12}/>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {item.type !== "folder" && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openPreview(item)} title="Prévisualiser">
                          <Icon name="eye" size={12}/>
                        </button>
                      )}
                      {isEditeur && (
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteFile(item.name)} title="Supprimer">
                          <Icon name="trash" size={12}/>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Icône / miniature */}
                <div className={`grid-card-icon${item.type === "folder" ? " folder-icon" : ""}`} style={{color: iconColor}}>
                  {isImageFile(item) && currentPath !== "CORBEILLE" ? (
                    <>
                      <img
                        className="grid-card-thumb"
                        src={api.previewUrl(currentPath === "." ? item.name : `${currentPath}/${item.name}`)}
                        alt=""
                        loading="lazy"
                        onError={e => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling.style.display = "flex";
                        }}
                      />
                      <span className="grid-card-thumb-fallback"><Icon name={iconName} size={28}/></span>
                    </>
                  ) : (
                    <Icon name={iconName} size={28}/>
                  )}
                </div>

                {/* Nom */}
                <span className="grid-card-name">{highlight(item.name)}</span>

                {/* Méta */}
                <span className="grid-card-meta">
                  {item.type === "folder" ? "Dossier" : formatSize(item.size)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FILE TABLE (vue liste) ── */}
      {viewMode === "list" && (
      <ul
        className="file-table"
        onContextMenu={e => { e.preventDefault(); setContextMenu({ x:e.clientX, y:e.clientY, item:null }); }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = isEditeur ? "copy" : "none"; }}
        onDrop={async e => {
          e.preventDefault(); e.stopPropagation(); setIsDraggingExternal(false);
          if (!isEditeur) { showToast("Les lecteurs ne peuvent pas uploader", "error"); return; }
          if (currentPath === "CORBEILLE") { showToast("Impossible d'uploader dans la corbeille", "info"); return; }
          const items = e.dataTransfer.items;
          if (!items || items.length === 0) return;
          for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (entry) await processEntry(entry);
          }
          showToast("Upload terminé", "success"); fetchFiles();
        }}
      >
        {sortedFiles.length === 0 && (
          <li style={{display:"block"}}>
            <div className="empty-state">
              <Icon name={currentPath === "CORBEILLE" ? "trash" : "folder"} size={42}/>
              <p>{currentPath === "CORBEILLE" ? "La corbeille est vide" : "Ce dossier est vide"}</p>
            </div>
          </li>
        )}

        {sortedFiles.map((item, index) => {
          const isSelected = selectedItems.some(i => i.name === item.name && i.path === currentPath);
          const iconName   = getFileIcon(item);
          const iconColor  = getIconColor(item);

          return (
            <li
              key={item.name}
              className={isSelected ? "selected" : ""}
              draggable={editingItem !== item.name}
              onDragStart={() => handleDragStart(item)}
              onDragOver={item.type === "folder" ? e => e.preventDefault() : undefined}
              onDrop={item.type === "folder" ? () => handleDrop(item) : undefined}
              onClick={e => {
                if (clickTimeout) clearTimeout(clickTimeout);
                const t = setTimeout(() => handleSelect(item, index, e), 200);
                setClickTimeout(t);
              }}
              onDoubleClick={e => { e.stopPropagation(); if (clickTimeout) clearTimeout(clickTimeout); handleDoubleClick(item); }}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation();
                if (!selectedItems.some(i => i.name === item.name))
                  setSelectedItems([{ name:item.name, path:currentPath, type:item.type }]);
                setContextMenu({ x:e.clientX, y:e.clientY, item });
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  if (e.target.checked) setSelectedItems(prev => [...prev, { name:item.name, path:currentPath, type:item.type }]);
                  else setSelectedItems(prev => prev.filter(i => i.name !== item.name));
                }}
              />

              {editingItem === item.name ? (
                <div className="rename-inline" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter")  renameItem(item.name);
                      if (e.key === "Escape") { setEditingItem(null); setNewName(""); }
                    }}
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => renameItem(item.name)} disabled={isRenaming}>
                    <Icon name="check" size={12}/> Valider
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setEditingItem(null); setNewName(""); }}>
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="file-row">
                  {/* NOM */}
                  <div className="col-name">
                    <div className="file-icon-wrap" style={{color: iconColor}}>
                      <Icon name={iconName} size={16}/>
                    </div>
                    {item.type === "folder" ? (
                      <span
                        className="folder-name col-name-text"
                        onClick={e => { e.stopPropagation(); if (currentPath !== "CORBEILLE") openFolder(item.name); }}
                      >
                        {highlight(item.name)}
                      </span>
                    ) : (
                      <span className="col-name-text">{highlight(item.name)}</span>
                    )}
                  </div>

                  {/* TYPE */}
                  <div className="col-type">{getFileTypeLabel(item)}</div>

                  {/* TAILLE */}
                  <div className="col-size">{item.type === "file" ? formatSize(item.size) : "—"}</div>

                  {/* DATE */}
                  <div className="col-date">{formatDate(item.modified)}</div>

                  {/* ACTIONS */}
                  <div className="col-actions">
                    {currentPath === "CORBEILLE" ? (
                      <>
                        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); restoreFromTrash(item); }} title="Restaurer">
                          <Icon name="restore" size={13}/> Restaurer
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteFromTrash(item); }} title="Supprimer définitivement">
                            <Icon name="trash" size={13}/>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {item.type !== "folder" && (
                          <>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); openPreview(item); }} title="Prévisualiser">
                              <Icon name="eye" size={13}/>
                            </button>
                            <a
                              className="btn btn-ghost btn-icon btn-sm"
                              href={api.downloadUrl(currentPath, item.name)}
                              download
                              onClick={e => e.stopPropagation()}
                              title="Télécharger"
                            >
                              <Icon name="download" size={13}/>
                            </a>
                          </>
                        )}
                        {isEditeur && (
                          <>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); setEditingItem(item.name); setNewName(item.name); }} title="Renommer">
                              <Icon name="rename" size={13}/>
                            </button>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={e => { e.stopPropagation(); deleteFile(item.name); }} title="Supprimer">
                              <Icon name="trash" size={13}/>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}

      {error && <p style={{color:"var(--danger)",marginTop:8,fontSize:13}}>{error}</p>}

      {/* ── CONTEXT MENU ── */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              {currentPath === "CORBEILLE" && (
                <>
                  <button className="ctx-btn" onClick={() => { restoreFromTrash(contextMenu.item); setContextMenu(null); }}>
                    <Icon name="restore" size={14}/> Restaurer
                  </button>
                  {isAdmin && (
                    <button className="ctx-btn danger" onClick={() => { deleteFromTrash(contextMenu.item); setContextMenu(null); }}>
                      <Icon name="trash" size={14}/> Supprimer définitivement
                    </button>
                  )}
                </>
              )}
              {currentPath !== "CORBEILLE" && (
                <>
                  <button className="ctx-btn" onClick={() => { copyFiles(); setContextMenu(null); }}>
                    <Icon name="copy" size={14}/> Copier
                  </button>
                  <button className="ctx-btn" onClick={() => { cutFiles(); setContextMenu(null); }}>
                    <Icon name="cut" size={14}/> Couper
                  </button>
                  <div className="context-menu-sep"/>
                  <button className="ctx-btn" onClick={() => {
                    window.open(api.downloadUrl(currentPath, contextMenu.item.name), "_blank");
                    setContextMenu(null);
                  }}>
                    <Icon name="download" size={14}/> Télécharger
                  </button>
                  <button className="ctx-btn" onClick={() => { openPreview(contextMenu.item); setContextMenu(null); }}>
                    <Icon name="eye" size={14}/> Prévisualiser
                  </button>
                  {contextMenu.item.type !== "folder" && contextMenu.item.name.endsWith(".txt") && (
                    <button className="ctx-btn" onClick={() => { openTextEditor(contextMenu.item); setContextMenu(null); }}>
                      <Icon name="edit" size={14}/> Modifier
                    </button>
                  )}
                  <button className="ctx-btn" onClick={() => { handleVersions(contextMenu.item); setContextMenu(null); }}>
                    <Icon name="versions" size={14}/> Versions
                  </button>
                </>
              )}
              {isAdmin && currentPath !== "CORBEILLE" && (
                <>
                  <div className="context-menu-sep"/>
                  <button className="ctx-btn" onClick={() => {
                    setEditingItem(contextMenu.item.name); setNewName(contextMenu.item.name); setContextMenu(null);
                  }}>
                    <Icon name="rename" size={14}/> Renommer
                  </button>
                  <button className="ctx-btn danger" onClick={() => { deleteFile(contextMenu.item.name); setContextMenu(null); }}>
                    <Icon name="trash" size={14}/> Supprimer
                  </button>
                </>
              )}
            </>
          ) : (
            <button className="ctx-btn" onClick={() => { pasteFiles(); setContextMenu(null); }} disabled={!clipboard.length}>
              <Icon name="paste" size={14}/> Coller
            </button>
          )}
        </div>
      )}

      {/* ── PREVIEW ── */}
      {previewFile && (() => {
        const ext = previewFile.split(".").pop().toLowerCase();
        const url = api.previewUrl(previewFile);
        const isImg   = ["png","jpg","jpeg","gif","webp"].includes(ext);
        const isVideo = ["mp4","webm"].includes(ext);
        const isAudio = ["mp3","ogg","wav"].includes(ext);
        const isPdf   = ext === "pdf";
        return (
          <Modal title={`Prévisualisation — ${previewFile.split("/").pop()}`} onClose={() => setPreviewFile(null)}>
            {isImg && (
              <div style={{textAlign:"center",padding:8}}>
                <img
                  src={url}
                  alt={previewFile}
                  style={{maxWidth:"100%",maxHeight:"70vh",borderRadius:8,boxShadow:"var(--shadow-md)"}}
                  onError={e => e.target.alt = "Impossible de charger l'image"}
                />
              </div>
            )}
            {isVideo && (
              <video controls style={{width:"100%",borderRadius:8,background:"#000",maxHeight:"70vh"}}>
                <source src={url}/>
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )}
            {isAudio && (
              <div style={{padding:"32px 16px",textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:16}}>🎵</div>
                <p style={{margin:"0 0 16px",fontWeight:700,color:"var(--text)"}}>{previewFile.split("/").pop()}</p>
                <audio controls style={{width:"100%"}}>
                  <source src={url}/>
                </audio>
              </div>
            )}
            {isPdf && (
              <iframe
                className="preview-iframe"
                src={url}
                title="Prévisualisation PDF"
              />
            )}
            {!isImg && !isVideo && !isAudio && !isPdf && (
              <iframe
                className="preview-iframe"
                src={url}
                title="Prévisualisation"
              />
            )}
            <div style={{display:"flex",justifyContent:"flex-end",padding:"10px 0 0"}}>
              <a
                href={api.downloadUrl(
                  previewFile.includes("/") ? previewFile.substring(0,previewFile.lastIndexOf("/")) : ".",
                  previewFile.split("/").pop()
                )}
                className="btn btn-sm"
                download
              >
                <Icon name="download" size={13}/> Télécharger
              </a>
            </div>
          </Modal>
        );
      })()}

      {/* ── TEXT EDITOR ── */}
      {textEditorOpen && (
        <Modal
          title="Éditeur de texte"
          onClose={() => setTextEditorOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setTextEditorOpen(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={saveTextFile} disabled={savingText}>
                <Icon name="check" size={14}/> {savingText ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </>
          }
        >
          <p style={{margin:"0 0 10px",fontSize:12,color:"var(--muted)"}}>{textFilePath}</p>
          <textarea
            className="text-editor-area"
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
          />
        </Modal>
      )}

      {/* ── VERSIONS ── */}
      {showVersions && (
        <Modal title={`Versions — ${versionItem?.name}`} onClose={() => setShowVersions(false)}>
          {versions.length === 0 ? (
            <p style={{color:"var(--muted)",fontSize:13}}>Aucune version disponible.</p>
          ) : (
            <ul style={{padding:0,margin:0,listStyle:"none"}}>
              {versions.map((v, i) => (
                <li key={i} className="version-item">
                  <div>
                    <div className="version-name">{v.name}</div>
                    <div className="version-date">{v.date}</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => setConfirmModal({
                      title: "Restaurer cette version",
                      message: `Restaurer "${v.name}" ?`,
                      confirmLabel: "Restaurer",
                      danger: false,
                      onConfirm: async () => {
                        setConfirmModal(null);
                        try {
                          const data = await api.restoreVersion(v.versionPath, v.targetPath);
                          if (data.success) { showToast("Version restaurée", "success"); setShowVersions(false); fetchFiles(); }
                          else showToast(data.message, "error");
                        } catch { showToast("Erreur restauration", "error"); }
                      }
                    })}
                  >
                    <Icon name="restore" size={13}/> Restaurer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {/* ── PROMPT MODAL ── */}
      {promptModal && (
        <PromptModal
          title={promptModal.title}
          label={promptModal.label}
          placeholder={promptModal.placeholder}
          defaultValue={promptModal.defaultValue}
          onConfirm={promptModal.onConfirm}
          onClose={() => setPromptModal(null)}
        />
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {/* ── BARRE DE STATUT ── */}
      <div className="status-bar">
        <div className="status-cell">
          <Icon name="folder" size={12}/>
          <span><strong>{folderCount}</strong> dossier{folderCount > 1 ? "s" : ""}</span>
        </div>
        <div className="status-cell">
          <Icon name="file" size={12}/>
          <span><strong>{fileCount}</strong> fichier{fileCount > 1 ? "s" : ""}</span>
        </div>
        {selectedCount > 0 && (
          <div className="status-cell highlight">
            <Icon name="check" size={12}/>
            <span><strong>{selectedCount}</strong> sélectionné{selectedCount > 1 ? "s" : ""}</span>
          </div>
        )}
        <div className="status-cell">
          <Icon name="home" size={12}/>
          <span>{currentPath === "." ? "Racine" : currentPath === "CORBEILLE" ? "Corbeille" : currentPath}</span>
        </div>
        <div className="status-cell">
          <Icon name="admin" size={12}/>
          <span>
            {isAdmin ? "Administrateur" : isEditeur ? "Éditeur" : "Lecteur"}
          </span>
        </div>
        <div className="shortcuts-mini">
          <span className="sc-item"><kbd>Ctrl+C</kbd> Copier</span>
          <span className="sc-item"><kbd>Ctrl+V</kbd> Coller</span>
          <span className="sc-item"><kbd>Suppr</kbd> Supprimer</span>
          <span className="sc-item"><kbd>F2</kbd> Renommer</span>
          <span className="sc-item"><kbd>F5</kbd> Actualiser</span>
          <span className="sc-item"><kbd>Échap</kbd> Fermer</span>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <Icon
            name={toast.type === "success" ? "check" : toast.type === "error" ? "close" : "eye"}
            size={14}
          />
          {toast.message}
        </div>
      )}

      {/* ── DROP OVERLAY ── */}
      {isDraggingExternal && (
        <div className="drop-overlay"
          onDragEnter={e => e.preventDefault()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
        >
          <div className="drop-box">
            <Icon name="upload" size={36}/>
            Déposez vos fichiers ici
          </div>
        </div>
      )}

      {/* ── ADMIN PANEL ── */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)}/>}

    </div>
  );
}

export default App;
