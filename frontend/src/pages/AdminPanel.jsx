import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons.jsx";

const API = "http://localhost/explorateur/backend";

/* ── Helpers ── */
function formatBytes(bytes) {
  if (!bytes) return "0 o";
  const units = ["o","Ko","Mo","Go"];
  let value = Number(bytes), unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

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

function avatarColor(username = "") {
  const colors = ["#0f766e","#7c3aed","#b45309","#0369a1","#be185d","#047857","#dc2626"];
  let hash = 0;
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="chart-bars">
      {data.map(d => (
        <div className="chart-bar-wrap" key={d.label}>
          <span className="chart-bar-value">{d.value}</span>
          <div className="chart-bar" style={{ height:`${Math.max((d.value/max)*100,4)}px`, background: d.color }}/>
          <span className="chart-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const ROLES = ["admin","editeur","lecteur"];
const ROLE_LABELS = { admin:"Admin", editeur:"Éditeur", lecteur:"Lecteur" };

export default function AdminPanel({ onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState("users");
  const [logSearch,  setLogSearch]  = useState("");
  const [logFilter,  setLogFilter]  = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [pendingRoles, setPendingRoles] = useState({}); // { userId: role } pour les selects "en attente"

  /* Création utilisateur */
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username:"", password:"", role:"lecteur" });
  const [creating, setCreating] = useState(false);

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const load = async () => {
    try {
      const res  = await fetch(`${API}/admin_summary.php`, { credentials:"include" });
      const json = await res.json();
      if (!json.success) { setError(json.message || "Chargement impossible."); return; }
      setData(json);
    } catch { setError("Impossible de joindre le backend."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* Comptes en attente */
  const pendingUsers  = useMemo(() => data?.users.filter(u => u.status === "pending")  ?? [], [data]);
  const activeUsers   = useMemo(() => data?.users.filter(u => u.status !== "pending")  ?? [], [data]);

  /* KPIs */
  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      { label:"Utilisateurs",    value: data.stats.users,                    icon:"admin",    bg:"#f0fdfa", color:"#0f766e" },
      { label:"En attente",      value: pendingUsers.length,                  icon:"versions", bg:"#fffbeb", color:"#d97706" },
      { label:"Fichiers disque", value: data.stats.disk_files,               icon:"file",     bg:"#eff6ff", color:"#2563eb" },
      { label:"Stockage utilisé",value: formatBytes(data.stats.disk_size),   icon:"download", bg:"#fdf4ff", color:"#7c3aed" },
    ];
  }, [data, pendingUsers]);

  /* Logs filtrés */
  const filteredLogs = useMemo(() => {
    if (!data) return [];
    return data.logs.filter(log => {
      const matchSearch = !logSearch ||
        log.user?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.target?.toLowerCase().includes(logSearch.toLowerCase());
      const matchFilter = logFilter === "all" || getLogBadgeClass(log.action) === logFilter;
      return matchSearch && matchFilter;
    });
  }, [data, logSearch, logFilter]);

  /* Charts */
  const chartUsers = useMemo(() => {
    if (!data) return [];
    const byRole = {};
    data.users.forEach(u => { byRole[u.role] = (byRole[u.role]||0) + 1; });
    const colors = { admin:"#f59e0b", editeur:"#0d9488", lecteur:"#3b82f6" };
    return Object.entries(byRole).map(([r,v]) => ({ label: ROLE_LABELS[r]??r, value:v, color: colors[r]??"#94a3b8" }));
  }, [data]);

  const chartActions = useMemo(() => {
    if (!data) return [];
    const counts = {};
    data.logs.forEach(l => { const t = getLogBadgeClass(l.action); counts[t] = (counts[t]||0)+1; });
    const colorMap = { upload:"#10b981", delete:"#ef4444", rename:"#3b82f6", create:"#22c55e", move:"#f59e0b", login:"#8b5cf6", default:"#94a3b8" };
    return Object.entries(counts).map(([k,v]) => ({ label:k, value:v, color:colorMap[k] }));
  }, [data]);

  /* Actions admin */
  const approveUser = async (id, role = "lecteur") => {
    try {
      const res  = await fetch(`${API}/admin_approve_user.php`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id, role, status:"active" })
      });
      const json = await res.json();
      if (json.success) {
        showMsg("Compte validé et rôle attribué");
        setData(d => ({ ...d, users: d.users.map(u => u.id===id ? {...u, status:"active", role} : u) }));
      } else showMsg(json.message ?? "Erreur", "error");
    } catch { showMsg("Erreur réseau", "error"); }
  };

  const changeRole = async (id, role) => {
    try {
      const res  = await fetch(`${API}/admin_approve_user.php`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id, role })
      });
      const json = await res.json();
      if (json.success) {
        showMsg("Rôle mis à jour");
        setData(d => ({ ...d, users: d.users.map(u => u.id===id ? {...u, role} : u) }));
      } else showMsg(json.message ?? "Erreur", "error");
    } catch { showMsg("Erreur réseau", "error"); }
  };

  const blockUser = async (id, block) => {
    try {
      const res  = await fetch(`${API}/admin_approve_user.php`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id, status: block ? "blocked" : "active" })
      });
      const json = await res.json();
      if (json.success) {
        showMsg(block ? "Compte bloqué" : "Compte réactivé");
        setData(d => ({ ...d, users: d.users.map(u => u.id===id ? {...u, status: block?"blocked":"active"} : u) }));
      } else showMsg(json.message ?? "Erreur", "error");
    } catch { showMsg("Erreur réseau", "error"); }
  };

  const deleteUser = async (id) => {
    try {
      const res  = await fetch(`${API}/admin_delete_user.php`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        showMsg("Compte supprimé");
        setData(d => ({ ...d, users: d.users.filter(u => u.id !== id) }));
        setDeleteConfirm(null);
      } else showMsg(json.message ?? "Erreur", "error");
    } catch { showMsg("Erreur réseau", "error"); }
  };

  const createUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(`${API}/admin_create_user.php`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(newUser)
      });
      const json = await res.json();
      if (json.success) {
        showMsg("Compte créé");
        setShowCreate(false);
        setNewUser({ username:"", password:"", role:"lecteur" });
        load();
      } else showMsg(json.message ?? "Erreur", "error");
    } catch { showMsg("Erreur réseau", "error"); }
    finally { setCreating(false); }
  };

  /* ── Rendu ── */
  return (
    <div className="admin-overlay" onClick={onClose}>
      <section className="admin-panel" onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <header className="admin-header">
          <div className="admin-header-text">
            <p>Administration</p>
            <h2>Centre de contrôle</h2>
            <span>Gestion des utilisateurs, rôles, fichiers et historique</span>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn-close" onClick={() => setShowCreate(s => !s)}>
              <Icon name="file_new" size={14}/> Créer un compte
            </button>
            <button className="admin-btn-close" onClick={onClose}>
              <Icon name="close" size={14}/> Fermer
            </button>
          </div>
        </header>

        {/* FORMULAIRE CRÉATION */}
        {showCreate && (
          <div style={{padding:"16px 28px", borderBottom:"1px solid var(--line)", background:"var(--surface-soft)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end"}}>
            <div style={{flex:"1 1 160px"}}>
              <label style={{fontSize:11,fontWeight:700,color:"var(--muted)",display:"block",marginBottom:4}}>NOM D'UTILISATEUR</label>
              <input
                style={{width:"100%",height:36,padding:"0 10px",border:"1px solid var(--line-strong)",borderRadius:"var(--radius-sm)",fontSize:13,outline:"none",background:"var(--surface)",color:"var(--text)"}}
                placeholder="ex: jean.dupont"
                value={newUser.username}
                onChange={e => setNewUser(u => ({...u, username: e.target.value}))}
              />
            </div>
            <div style={{flex:"1 1 160px"}}>
              <label style={{fontSize:11,fontWeight:700,color:"var(--muted)",display:"block",marginBottom:4}}>MOT DE PASSE</label>
              <input
                type="password"
                style={{width:"100%",height:36,padding:"0 10px",border:"1px solid var(--line-strong)",borderRadius:"var(--radius-sm)",fontSize:13,outline:"none",background:"var(--surface)",color:"var(--text)"}}
                placeholder="••••••••"
                value={newUser.password}
                onChange={e => setNewUser(u => ({...u, password: e.target.value}))}
              />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"var(--muted)",display:"block",marginBottom:4}}>RÔLE</label>
              <select className="role-select" style={{height:36}} value={newUser.role} onChange={e => setNewUser(u => ({...u, role: e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={createUser} disabled={creating || !newUser.username.trim() || !newUser.password.trim()}>
              <Icon name="check" size={13}/> {creating ? "Création…" : "Créer"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>
              <Icon name="close" size={13}/>
            </button>
          </div>
        )}

        {/* ÉTATS */}
        {loading && <div className="admin-empty"><div className="spinner"/><span>Chargement…</span></div>}
        {error   && <div className="admin-empty"><span style={{color:"var(--danger)"}}>{error}</span></div>}

        {data && (<>
          {/* KPIs */}
          <div className="admin-kpis">
            {kpis.map(k => (
              <div className="admin-kpi" key={k.label}>
                <div className="admin-kpi-icon" style={{background:k.bg, color:k.color}}><Icon name={k.icon} size={18}/></div>
                <label>{k.label}</label>
                <strong>{k.value}</strong>
              </div>
            ))}
          </div>

          {/* BANNER ATTENTE */}
          {pendingUsers.length > 0 && (
            <div className="pending-banner" style={{margin:"0 28px 0"}}>
              <Icon name="versions" size={16}/>
              <span className="pending-count">{pendingUsers.length}</span>
              compte(s) en attente de validation — cliquez sur <strong style={{marginLeft:4}}>"Utilisateurs"</strong> pour les traiter.
            </div>
          )}

          {/* TABS */}
          <div className="admin-tabs">
            {[
              { key:"users",  label:"Utilisateurs", icon:"admin",    count: data.users.length },
              { key:"logs",   label:"Historique",   icon:"versions", count: data.logs.length },
              { key:"charts", label:"Statistiques", icon:"grid",     count: null },
            ].map(t => (
              <button key={t.key} className={`admin-tab${tab===t.key?" active":""}`} onClick={() => setTab(t.key)}>
                <Icon name={t.icon} size={14}/>
                {t.label}
                {t.count !== null && (
                  <span className="admin-tab-badge">
                    {t.key==="users" && pendingUsers.length > 0
                      ? <span style={{color:"#d97706"}}>{t.count} ⚠</span>
                      : t.count
                    }
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="admin-body">

            {/* ── ONGLET UTILISATEURS ── */}
            {tab === "users" && (<>

              {/* Comptes en attente */}
              {pendingUsers.length > 0 && (
                <div style={{marginBottom:24}}>
                  <div className="admin-section-title">
                    <h3 style={{color:"var(--amber)"}}>⚠ Comptes en attente de validation</h3>
                    <span>{pendingUsers.length} compte(s)</span>
                  </div>
                  <div className="admin-users">
                    <div className="admin-users-head-5">
                      <span>Nom</span><span>Statut</span><span>Inscription</span><span>Attribuer le rôle</span><span style={{textAlign:"right"}}>Actions</span>
                    </div>
                    {pendingUsers.map(user => {
                      const pendingRole = pendingRoles[user.id] ?? "lecteur";
                      const setPendingRole = (role) => setPendingRoles(r => ({ ...r, [user.id]: role }));
                      return (
                        <div className="admin-users-row-5" key={user.id}>
                          <div className="user-name-cell">
                            <span className="user-avatar" style={{background:avatarColor(user.username)}}>
                              {user.username.slice(0,2).toUpperCase()}
                            </span>
                            <span className="user-fullname">{user.username}</span>
                          </div>
                          <span className="status-badge pending"><Icon name="versions" size={10}/> En attente</span>
                          <span style={{fontSize:12,color:"var(--muted)"}}>{user.created_at ?? "—"}</span>
                          <select className="role-select" value={pendingRole} onChange={e => setPendingRole(e.target.value)}>
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                          <div className="user-row-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => approveUser(user.id, pendingRole)}>
                              <Icon name="check" size={12}/> Valider
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id)}>
                              <Icon name="close" size={12}/> Refuser
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comptes actifs */}
              <div className="admin-section-title">
                <h3>Comptes actifs</h3>
                <span>{activeUsers.length} compte(s)</span>
              </div>
              <div className="admin-users">
                <div className="admin-users-head-5">
                  <span>Nom</span><span>Statut</span><span>Création</span><span>Rôle</span><span style={{textAlign:"right"}}>Actions</span>
                </div>
                {activeUsers.length === 0 && (
                  <div className="admin-empty"><Icon name="admin" size={28}/><span>Aucun compte actif</span></div>
                )}
                {activeUsers.map(user => (
                  <div className="admin-users-row-5" key={user.id}>
                    <div className="user-name-cell">
                      <span className="user-avatar" style={{background:avatarColor(user.username)}}>
                        {user.username.slice(0,2).toUpperCase()}
                      </span>
                      <span className="user-fullname">{user.username}</span>
                    </div>
                    <span className={`status-badge ${user.status==="blocked"?"blocked":"active"}`}>
                      {user.status === "blocked" ? <><Icon name="close" size={10}/> Bloqué</> : <><Icon name="check" size={10}/> Actif</>}
                    </span>
                    <span style={{fontSize:12,color:"var(--muted)"}}>{user.created_at ?? "—"}</span>
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={e => changeRole(user.id, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <div className="user-row-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setLogSearch(user.username); setTab("logs"); }}
                        title="Voir les logs"
                      >
                        <Icon name="versions" size={12}/>
                      </button>
                      <button
                        className={`btn btn-sm ${user.status==="blocked"?"btn-primary":"btn-ghost"}`}
                        onClick={() => blockUser(user.id, user.status !== "blocked")}
                        title={user.status==="blocked" ? "Réactiver" : "Bloquer"}
                      >
                        {user.status === "blocked"
                          ? <><Icon name="check" size={12}/> Réactiver</>
                          : <><Icon name="close" size={12}/> Bloquer</>
                        }
                      </button>
                      {deleteConfirm === user.id ? (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id)}>
                            <Icon name="check" size={12}/> Confirmer
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                            <Icon name="close" size={12}/>
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(user.id)}>
                          <Icon name="trash" size={12}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>)}

            {/* ── ONGLET LOGS ── */}
            {tab === "logs" && (<>
              <div className="admin-section-title">
                <h3>Historique des actions</h3>
                <span>{filteredLogs.length} résultat(s)</span>
              </div>
              <div className="logs-filter">
                <input placeholder="Rechercher (user, action, cible…)" value={logSearch} onChange={e => setLogSearch(e.target.value)}/>
                <select value={logFilter} onChange={e => setLogFilter(e.target.value)}>
                  <option value="all">Toutes les actions</option>
                  <option value="upload">Upload</option>
                  <option value="delete">Suppression</option>
                  <option value="rename">Renommage</option>
                  <option value="create">Création</option>
                  <option value="move">Déplacement</option>
                  <option value="login">Connexion</option>
                </select>
                {(logSearch || logFilter !== "all") && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setLogSearch(""); setLogFilter("all"); }}>
                    <Icon name="close" size={12}/> Réinitialiser
                  </button>
                )}
              </div>
              {filteredLogs.length === 0
                ? <div className="admin-empty"><Icon name="search" size={32}/><span>Aucune action trouvée</span></div>
                : (
                  <div className="admin-logs">
                    <div className="admin-logs-head">
                      <span>Date</span><span>Utilisateur</span><span>Action</span><span>Cible</span>
                    </div>
                    {filteredLogs.map((log, i) => (
                      <div className="admin-logs-row" key={i}>
                        <span style={{color:"var(--muted)",fontSize:11}}>{log.date}</span>
                        <strong style={{fontSize:13}}>{log.user}</strong>
                        <span><span className={`log-action-badge ${getLogBadgeClass(log.action)}`}>{log.action}</span></span>
                        <span style={{color:"var(--muted)",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.target||"—"}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </>)}

            {/* ── ONGLET STATS ── */}
            {tab === "charts" && (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                <div className="admin-chart">
                  <p className="admin-chart-title"><Icon name="admin" size={13}/> Répartition par rôle</p>
                  {chartUsers.length > 0 ? <BarChart data={chartUsers}/> : <div className="admin-empty"><span>Aucune donnée</span></div>}
                </div>
                <div className="admin-chart">
                  <p className="admin-chart-title"><Icon name="versions" size={13}/> Actions par type</p>
                  {chartActions.length > 0 ? <BarChart data={chartActions}/> : <div className="admin-empty"><span>Aucune action enregistrée</span></div>}
                </div>
                <div className="admin-chart" style={{gridColumn:"1/-1"}}>
                  <p className="admin-chart-title"><Icon name="file" size={13}/> Synthèse stockage</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginTop:8}}>
                    {[
                      { label:"Fichiers sur disque", value:data.stats.disk_files,   color:"#10b981" },
                      { label:"Dossiers",            value:data.stats.disk_folders,  color:"#f59e0b" },
                      { label:"Versions archivées",  value:data.stats.versions,      color:"#8b5cf6" },
                      { label:"Actions journalisées",value:data.stats.logs,          color:"#3b82f6" },
                    ].map(s => (
                      <div key={s.label} style={{padding:"16px",borderRadius:"10px",border:"1px solid var(--line)",background:"var(--surface)",textAlign:"center"}}>
                        <div style={{fontSize:32,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:6}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>)}

        {/* TOAST INTERNE */}
        {toast && (
          <div style={{
            position:"fixed", bottom:24, right:24, zIndex:99999,
            padding:"11px 18px", borderRadius:"10px",
            background: toast.type==="error" ? "#991b1b" : "#15803d",
            color:"#fff", fontSize:13, fontWeight:700,
            boxShadow:"0 8px 24px rgba(0,0,0,.25)",
            display:"flex", alignItems:"center", gap:8
          }}>
            <Icon name={toast.type==="error"?"close":"check"} size={14}/>
            {toast.msg}
          </div>
        )}

      </section>
    </div>
  );
}
