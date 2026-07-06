import { useEffect, useState } from "react";
import { Icon } from "../icons.jsx";

const API = "http://localhost/explorateur/backend";

const EXT_COLORS = {
  pdf:"#ef4444", png:"#8b5cf6", jpg:"#8b5cf6", jpeg:"#8b5cf6",
  gif:"#8b5cf6", webp:"#8b5cf6", txt:"#3b82f6", md:"#3b82f6",
  zip:"#f97316", rar:"#f97316", doc:"#2563eb", docx:"#2563eb",
  xls:"#16a34a", xlsx:"#16a34a", mp4:"#0ea5e9", mp3:"#ec4899",
};

const EXT_ICON = {
  pdf:"pdf", png:"image", jpg:"image", jpeg:"image", gif:"image",
  webp:"image", svg:"image", txt:"text", md:"text",
  zip:"zip", rar:"zip", doc:"word", docx:"word",
  xls:"excel", xlsx:"excel", mp4:"video", mp3:"audio", wav:"audio",
};

function getLogBadgeClass(action = "") {
  const a = action.toLowerCase();
  if (a.includes("upload") || a.includes("télévers")) return "upload";
  if (a.includes("delete") || a.includes("supprim"))  return "delete";
  if (a.includes("rename") || a.includes("renomm"))   return "rename";
  if (a.includes("create") || a.includes("créat"))    return "create";
  if (a.includes("move")   || a.includes("déplac"))   return "move";
  if (a.includes("login")  || a.includes("connexion")) return "login";
  return "default";
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400)return `Il y a ${Math.floor(diff/3600)} h`;
  return `Il y a ${Math.floor(diff/86400)} j`;
}

export default function Dashboard({ onEnter, username, role }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/dashboard.php`, { credentials:"include" });
        const json = await res.json();
        if (json.success) setData(json);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const isAdmin = role === "admin";

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-brand">
          <div className="brand-mark" style={{width:48,height:48,fontSize:14}}>EM</div>
          <div>
            <p className="eyebrow" style={{margin:"0 0 3px"}}>EMM'S Files</p>
            <h1 style={{margin:0,fontSize:"clamp(28px,3.5vw,42px)",fontWeight:900,color:"#0f172a",lineHeight:1.1}}>
              Bonjour, {username} 👋
            </h1>
            <p style={{margin:"6px 0 0",fontSize:15,color:"var(--primary-dark)",fontWeight:700}}>
              Bienvenue sur <strong>EMM'S Files</strong>
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onEnter} style={{gap:8}}>
          <Icon name="folder" size={15}/> Ouvrir EMM'S Files
        </button>
      </header>

      {loading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80,gap:12,color:"var(--muted)"}}>
          <div className="spinner"/> Chargement du tableau de bord…
        </div>
      ) : data && (<>

        {/* KPIs */}
        <div className="dash-kpis">
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{background:"#f0fdfa",color:"#0f766e"}}>
              <Icon name="file" size={20}/>
            </div>
            <div>
              <span className="dash-kpi-label">Fichiers</span>
              <strong className="dash-kpi-value">{data.disk.files}</strong>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{background:"#fef3c7",color:"#d97706"}}>
              <Icon name="folder" size={20}/>
            </div>
            <div>
              <span className="dash-kpi-label">Dossiers</span>
              <strong className="dash-kpi-value">{data.disk.folders}</strong>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{background:"#fdf4ff",color:"#7c3aed"}}>
              <Icon name="download" size={20}/>
            </div>
            <div>
              <span className="dash-kpi-label">Stockage</span>
              <strong className="dash-kpi-value">{data.disk.size}</strong>
            </div>
          </div>
          {isAdmin && data.user_stats && (<>
            <div className="dash-kpi">
              <div className="dash-kpi-icon" style={{background:"#eff6ff",color:"#2563eb"}}>
                <Icon name="admin" size={20}/>
              </div>
              <div>
                <span className="dash-kpi-label">Utilisateurs</span>
                <strong className="dash-kpi-value">{data.user_stats.total}</strong>
              </div>
            </div>
            {data.user_stats.pending > 0 && (
              <div className="dash-kpi" style={{borderColor:"#fde68a",background:"#fffbeb"}}>
                <div className="dash-kpi-icon" style={{background:"#fef3c7",color:"#d97706"}}>
                  <Icon name="versions" size={20}/>
                </div>
                <div>
                  <span className="dash-kpi-label" style={{color:"#d97706"}}>En attente</span>
                  <strong className="dash-kpi-value" style={{color:"#d97706"}}>{data.user_stats.pending}</strong>
                </div>
              </div>
            )}
          </>)}
        </div>

        {/* CONTENU */}
        <div className="dash-grid">

          {/* FICHIERS RÉCENTS */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3><Icon name="versions" size={15}/> Fichiers récents</h3>
              <button className="btn btn-ghost btn-sm" onClick={onEnter}>
                Tout voir <Icon name="chevron_right" size={12}/>
              </button>
            </div>
            <div className="dash-file-list">
              {data.recent_files.length === 0 && (
                <div className="dash-empty">
                  <Icon name="file" size={28}/>
                  <span>Aucun fichier pour l'instant</span>
                </div>
              )}
              {data.recent_files.map((f, i) => {
                const color = EXT_COLORS[f.ext] ?? "#94a3b8";
                const icon  = EXT_ICON[f.ext]  ?? "file";
                return (
                  <div className="dash-file-item" key={i}>
                    <div className="dash-file-icon" style={{color}}>
                      <Icon name={icon} size={18}/>
                    </div>
                    <div className="dash-file-info">
                      <span className="dash-file-name">{f.name}</span>
                      <span className="dash-file-meta">
                        {f.ext.toUpperCase()} · {(f.size/1024).toFixed(0)} Ko
                      </span>
                    </div>
                    <span className="dash-file-date">{timeAgo(new Date(f.modified*1000).toISOString())}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVITÉ RÉCENTE */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3><Icon name="eye" size={15}/> Activité récente</h3>
              <span style={{fontSize:12,color:"var(--muted)"}}>
                {data.recent_logs.length} action(s)
              </span>
            </div>
            <div className="dash-activity-list">
              {data.recent_logs.length === 0 && (
                <div className="dash-empty">
                  <Icon name="versions" size={28}/>
                  <span>Aucune activité enregistrée</span>
                </div>
              )}
              {data.recent_logs.map((log, i) => (
                <div className="dash-activity-item" key={i}>
                  <span className={`log-action-badge ${getLogBadgeClass(log.action)}`}>
                    {log.action}
                  </span>
                  <div className="dash-activity-info">
                    <span className="dash-activity-user">{log.user}</span>
                    <span className="dash-activity-target" title={log.target}>
                      {log.target ? log.target.split("/").pop() : "—"}
                    </span>
                  </div>
                  <span className="dash-file-date">{timeAgo(log.date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACCÈS RAPIDE */}
          <div className="dash-card dash-quick">
            <div className="dash-card-header">
              <h3><Icon name="grid" size={15}/> Accès rapide</h3>
            </div>
            <div className="dash-quick-grid">
              <button className="dash-quick-btn" onClick={onEnter}>
                <div className="dash-quick-icon" style={{background:"#f0fdfa",color:"#0f766e"}}>
                  <Icon name="folder" size={22}/>
                </div>
                <span>Mes fichiers</span>
              </button>
              <button className="dash-quick-btn" onClick={onEnter}>
                <div className="dash-quick-icon" style={{background:"#eff6ff",color:"#2563eb"}}>
                  <Icon name="search" size={22}/>
                </div>
                <span>Rechercher</span>
              </button>
              <button className="dash-quick-btn" onClick={onEnter}>
                <div className="dash-quick-icon" style={{background:"#fdf4ff",color:"#7c3aed"}}>
                  <Icon name="upload" size={22}/>
                </div>
                <span>Uploader</span>
              </button>
              {isAdmin && (
                <button className="dash-quick-btn" onClick={onEnter}>
                  <div className="dash-quick-icon" style={{background:"#fef3c7",color:"#d97706"}}>
                    <Icon name="admin" size={22}/>
                  </div>
                  <span>Admin</span>
                </button>
              )}
            </div>

            {/* Rôle badge */}
            <div style={{marginTop:16,padding:"12px 16px",border:"1px solid var(--line)",borderRadius:"var(--radius)",background:"var(--surface-soft)",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background: isAdmin?"#fef3c7":role==="editeur"?"#f0fdfa":"#eff6ff",display:"grid",placeItems:"center",color:isAdmin?"#d97706":role==="editeur"?"#0f766e":"#2563eb"}}>
                <Icon name="admin" size={16}/>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{username}</div>
                <div style={{fontSize:11,color:"var(--muted)",fontWeight:600}}>
                  {isAdmin ? "Administrateur" : role === "editeur" ? "Éditeur" : "Lecteur"} ·{" "}
                  {isAdmin ? "Accès complet" : role === "editeur" ? "Peut modifier" : "Lecture seule"}
                </div>
              </div>
            </div>
          </div>

        </div>
      </>)}
    </div>
  );
}
