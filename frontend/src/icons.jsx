// Bibliothèque d'icônes SVG légères — pas de dépendance externe

export const Icon = ({ name, size = 16, className = "" }) => {
  const paths = {
    folder:     <><path d="M3 7a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.41.59L10 7h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="currentColor"/></>,
    file:       <><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v5h5" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    pdf:        <><rect x="3" y="2" width="18" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M7 12h3.5a1.5 1.5 0 0 0 0-3H7v6m6-6h2a2 2 0 0 1 0 4h-2" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    image:      <><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="m21 15-5-5L5 21" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    text:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    zip:        <><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v2M12 4v2M10 8v2M12 10v2M10 14h2v4h-2z" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    word:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 13l2 6 2-4 2 4 2-6" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    excel:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12l8 0M8 16l8 0M8 12v8" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    audio:      <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M9 8l8 4-8 4V8z" fill="currentColor"/></>,
    video:      <><rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m16 10-6-3v8l6-5z" fill="currentColor"/></>,
    unknown:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    // Actions
    copy:       <><rect x="9" y="9" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    cut:        <><circle cx="6" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m20 4-8.12 12.12M14.47 14.48 20 20M8.88 8.88 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    paste:      <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="2" width="8" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    download:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    trash:      <><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    rename:     <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m18.5 2.5 3 3L12 15H9v-3z" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    folder_new: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5"/></>,
    file_new:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6M12 11v6M9 14h6" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    trash_open: <><path d="M3 3h18v3H3zM8 6v14M12 6v14M16 6v14M5 6l1 14h12l1-14" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    upload:     <><polyline points="16 16 12 12 8 16" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    eye:        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    versions:   <><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    restore:    <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    search:     <><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.5"/></>,
    logout:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    grid:       <><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    list:       <><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/></>,
    chevron_right: <><polyline points="9 18 15 12 9 6" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    home:       <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    close:      <><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5"/></>,
    back:       <><polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    check:      <><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    admin:      <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
    edit:       <><path d="M12 20h9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {paths[name] ?? paths.unknown}
    </svg>
  );
};

export const getFileIcon = (item) => {
  if (item.type === "folder") return "folder";
  const ext = item.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return "image";
  if (["txt","md"].includes(ext)) return "text";
  if (["zip","rar","7z","tar","gz"].includes(ext)) return "zip";
  if (["doc","docx"].includes(ext)) return "word";
  if (["xls","xlsx","csv"].includes(ext)) return "excel";
  if (["ppt","pptx"].includes(ext)) return "file";
  if (["mp3","wav","ogg","flac"].includes(ext)) return "audio";
  if (["mp4","avi","mkv","mov","webm"].includes(ext)) return "video";
  return "unknown";
};

export const getIconColor = (item) => {
  if (item.type === "folder") return "var(--icon-folder)";
  const ext = item.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "var(--icon-pdf)";
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return "var(--icon-image)";
  if (["txt","md"].includes(ext)) return "var(--icon-text)";
  if (["zip","rar","7z"].includes(ext)) return "var(--icon-zip)";
  if (["doc","docx"].includes(ext)) return "var(--icon-word)";
  if (["xls","xlsx","csv"].includes(ext)) return "var(--icon-excel)";
  if (["mp3","wav","ogg"].includes(ext)) return "var(--icon-audio)";
  if (["mp4","avi","mkv"].includes(ext)) return "var(--icon-video)";
  return "var(--icon-default)";
};
