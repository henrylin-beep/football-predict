import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function get(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("Erreur " + res.status);
  return res.json();
}

const G = {
  bg: "#06060f", card: "rgba(255,255,255,.032)", border: "rgba(255,255,255,.07)",
  accent: "#c8ff00", text: "#dde0f0", muted: "#44476a",
  green: "#00e87a", red: "#ff4f4f", yellow: "#ffd600",
};

// Hook pour détecter mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #06060f; color: #dde0f0; font-family: 'Syne', sans-serif; -webkit-text-size-adjust: 100%; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0a18; }
  ::-webkit-scrollbar-thumb { background: #22224a; border-radius: 2px; }
  select option { background: #0d0d1f; }
  input::placeholder { color: #2a2a4a; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  .fade { animation: fadeUp .3s ease both; }
  .spin { animation: spin .7s linear infinite; border-radius: 50%; }
  .mcard:hover { background: rgba(255,255,255,.055) !important; transform: translateY(-2px) !important; }
  .navbtn:hover { color: #c8ff00 !important; }

  /* ── RESPONSIVE ── */
  @media (max-width: 767px) {
    .kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .filter-row { flex-direction: column !important; }
    .match-grid { grid-template-columns: 1fr !important; }
    .result-3col { grid-template-columns: 1fr 1fr 1fr !important; }
    .market-grid { grid-template-columns: 1fr !important; }
    .stat-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
    .compare-grid { grid-template-columns: 1fr !important; }
    .standings-row { grid-template-columns: 32px 1fr 36px 36px 36px 44px !important; font-size: 11px !important; }
    .standings-header { grid-template-columns: 32px 1fr 36px 36px 36px 44px !important; font-size: 9px !important; }
    .league-tabs { gap: 5px !important; }
    .league-tab { padding: 5px 10px !important; font-size: 11px !important; }
    .page-title { font-size: 26px !important; }
    .search-row { flex-direction: column !important; }
  }
`;

// ─── SHARED ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:60, gap:14 }}>
      <div className="spin" style={{ width:34, height:34, border:"2px solid rgba(200,255,0,.15)", borderTopColor:G.accent }} />
      <div style={{ fontSize:11, color:G.muted, letterSpacing:3 }}>CHARGEMENT…</div>
    </div>
  );
}

function ErrBox({ msg, retry }) {
  return (
    <div style={{ textAlign:"center", padding:40 }}>
      <div style={{ fontSize:28, marginBottom:10 }}>⚠️</div>
      <div style={{ color:G.red, fontSize:13, marginBottom:8 }}>{msg}</div>
      <div style={{ color:G.muted, fontSize:12, marginBottom:16 }}>Vérifie que le backend est actif</div>
      {retry && (
        <button onClick={retry} style={{ background:G.accent, color:"#000", border:"none", borderRadius:8, padding:"10px 24px", cursor:"pointer", fontFamily:"'Syne'", fontWeight:700 }}>
          Réessayer
        </button>
      )}
    </div>
  );
}

function KPI({ label, value, color }) {
  return (
    <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:12, padding:"14px 16px" }}>
      <div style={{ fontSize:9, letterSpacing:2, color:G.muted, textTransform:"uppercase", marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color: color || G.text, fontFamily:"'JetBrains Mono'" }}>{value}</div>
    </div>
  );
}

function Bar({ val, color }) {
  return (
    <div style={{ flex:1, background:"rgba(255,255,255,.05)", borderRadius:3, height:6, overflow:"hidden" }}>
      <div style={{ height:"100%", width: val + "%", background: color, borderRadius:3, transition:"width .8s ease" }} />
    </div>
  );
}

function MatchCard({ fix, onClick }) {
  const p    = fix.prediction || {};
  const home = fix.teams?.home?.name || "?";
  const away = fix.teams?.away?.name || "?";
  const cc   = p.conf >= 75 ? G.green : p.conf >= 65 ? G.accent : G.yellow;
  const best = p.ph >= p.pd && p.ph >= p.pa ? "home" : p.pa >= p.pd ? "away" : "draw";
  const time = fix.fixture?.date
    ? new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })
    : "--:--";
  const flag = fix.league?.flag;
  const isLive = ["1H","HT","2H","ET","P"].includes(fix.fixture?.status?.short || "");

  return (
    <div className="mcard" onClick={onClick} style={{
      background:G.card, border:"1px solid " + G.border, borderRadius:14,
      padding:"16px 18px", cursor:"pointer", transition:"all .2s",
      borderLeft:"3px solid " + cc,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color:G.muted, letterSpacing:1, marginBottom:4, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
            {flag && <img src={flag} style={{ height:10 }} alt="" onError={e => { e.target.style.display="none"; }} />}
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>{fix.league?.country} · {fix.league?.name}</span>
            {isLive && <span style={{ background:"rgba(255,79,79,.15)", color:G.red, border:"1px solid rgba(255,79,79,.3)", borderRadius:4, fontSize:9, padding:"1px 6px", fontWeight:700 }}>● LIVE</span>}
          </div>
          <div style={{ fontSize:14, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {home} <span style={{ color:G.muted, fontWeight:400 }}>vs</span> {away}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
          <div style={{ fontSize:10, color:G.muted, fontFamily:"'JetBrains Mono'" }}>{time}</div>
          <div style={{ fontSize:18, fontWeight:800, color:cc, fontFamily:"'JetBrains Mono'" }}>{p.conf}%</div>
        </div>
      </div>
      <div className="result-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
        {[
          { l: home.split(" ")[0], v: p.ph, k:"home" },
          { l: "Nul", v: p.pd, k:"draw" },
          { l: away.split(" ")[0], v: p.pa, k:"away" },
        ].map(x => (
          <div key={x.k} style={{
            textAlign:"center", padding:"7px 4px", borderRadius:7,
            background: best === x.k ? "rgba(200,255,0,.05)" : "rgba(255,255,255,.02)",
            border:"1px solid " + (best === x.k ? "rgba(200,255,0,.3)" : "rgba(255,255,255,.05)"),
          }}>
            <div style={{ fontSize:9, color:G.muted, marginBottom:2 }}>{x.l}</div>
            <div style={{ fontSize:14, fontWeight:800, color: best === x.k ? G.accent : G.text, fontFamily:"'JetBrains Mono'" }}>{x.v}%</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, fontSize:11, color:G.muted, flexWrap:"wrap" }}>
        <span>Over 2.5 <b style={{ color: p.over25 > 50 ? G.accent : G.text }}>{p.over25}%</b></span>
        <span>BTTS <b style={{ color: p.btts > 50 ? G.green : G.text }}>{p.btts}%</b></span>
        <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono'", color:G.yellow }}>{p.score}</span>
      </div>
    </div>
  );
}

// ─── SIDEBAR / NAV MOBILE ─────────────────────────────────────────────────────
function Sidebar({ page, setPage, isMobile, menuOpen, setMenuOpen }) {
  const items = [
    { id:"dashboard", icon:"◈", label:"Dashboard" },
    { id:"search",    icon:"◎", label:"Recherche" },
    { id:"match",     icon:"⬡", label:"Analyse Match" },
    { id:"compare",   icon:"⇌", label:"Comparer" },
    { id:"standings", icon:"≡", label:"Classements" },
  ];

  const handleNav = (id) => {
    setPage(id);
    if (isMobile) setMenuOpen(false);
  };

  // Mobile : barre de navigation en bas
  if (isMobile) {
    return (
      <>
        {/* Header mobile */}
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(6,6,15,.95)", borderBottom:"1px solid " + G.border, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", backdropFilter:"blur(10px)" }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono'", fontSize:8, letterSpacing:3, color:G.accent, opacity:.7 }}>FOOTBALL</div>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:-1 }}>PREDICT<span style={{ color:G.accent }}>.</span></div>
          </div>
          <div style={{ fontSize:10, color:G.green }}>● En ligne</div>
        </div>

        {/* Nav en bas */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"rgba(6,6,15,.97)", borderTop:"1px solid " + G.border, display:"flex", backdropFilter:"blur(10px)" }}>
          {items.map(n => (
            <button key={n.id} onClick={() => handleNav(n.id)} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              padding:"10px 4px", background:"transparent", border:"none",
              color: page === n.id ? G.accent : G.muted,
              cursor:"pointer", fontSize:10, fontFamily:"'Syne'",
              borderTop: page === n.id ? "2px solid " + G.accent : "2px solid transparent",
              transition:"all .15s",
            }}>
              <span style={{ fontSize:18, marginBottom:2 }}>{n.icon}</span>
              <span style={{ fontSize:8, letterSpacing:.5 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  // Desktop : sidebar classique
  return (
    <div style={{ width:220, background:"rgba(0,0,0,.5)", borderRight:"1px solid " + G.border, display:"flex", flexDirection:"column", padding:"28px 0", flexShrink:0, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
      <div style={{ padding:"0 24px 32px" }}>
        <div style={{ fontFamily:"'JetBrains Mono'", fontSize:9, letterSpacing:4, color:G.accent, opacity:.7, marginBottom:5 }}>FOOTBALL</div>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-1 }}>PREDICT<span style={{ color:G.accent }}>.</span></div>
        <div style={{ fontSize:10, color:G.green, marginTop:4 }}>● Connecté au backend</div>
      </div>
      {items.map(n => (
        <button key={n.id} className="navbtn" onClick={() => handleNav(n.id)} style={{
          display:"flex", alignItems:"center", gap:12, padding:"12px 24px",
          background: page === n.id ? "rgba(200,255,0,.07)" : "transparent",
          border:"none", borderLeft: page === n.id ? "2px solid " + G.accent : "2px solid transparent",
          color: page === n.id ? G.accent : G.muted,
          cursor:"pointer", fontSize:13, fontFamily:"'Syne'", fontWeight: page === n.id ? 700 : 400,
          transition:"all .15s", textAlign:"left", width:"100%",
        }}>
          <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
        </button>
      ))}
      <div style={{ marginTop:"auto", padding:"24px", borderTop:"1px solid " + G.border }}>
        <div style={{ fontSize:10, color:G.muted, letterSpacing:2, marginBottom:4 }}>MODÈLE</div>
        <div style={{ fontSize:11, color:"#2a2a4a" }}>Poisson + ELO + H2H</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setPage, setSelected, isMobile }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [country, setCountry] = useState("");
  const [minConf, setMinConf] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await get("/fixtures/today")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error)   return <ErrBox msg={error} retry={load} />;

  const fixtures  = data?.fixtures || [];
  const countries = [...new Set(fixtures.map(f => f.league?.country).filter(Boolean))].sort();
  const filtered  = fixtures.filter(f => {
    if (country && f.league?.country !== country) return false;
    if ((f.prediction?.conf || 0) < minConf) return false;
    return true;
  });
  const high = filtered.filter(f => (f.prediction?.conf || 0) >= 70).length;
  const avg  = filtered.length ? Math.round(filtered.reduce((s, f) => s + (f.prediction?.conf || 0), 0) / filtered.length) : 0;

  return (
    <div className="fade">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:G.accent, marginBottom:5 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" }).toUpperCase()}
        </div>
        <h1 className="page-title" style={{ fontSize:32, fontWeight:800, letterSpacing:-1 }}>Matchs du jour</h1>
        <div style={{ fontSize:12, color:G.muted, marginTop:4 }}>{fixtures.length} matchs · {countries.length} pays</div>
      </div>

      <div className="kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <KPI label="Total" value={fixtures.length} />
        <KPI label="Affichés" value={filtered.length} color={G.accent} />
        <KPI label="≥70%" value={high} color={G.green} />
        <KPI label="Moy." value={avg + "%"} color={G.yellow} />
      </div>

      <div className="filter-row" style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <select value={country} onChange={e => setCountry(e.target.value)} style={{
          flex:1, minWidth:140, background:G.card, border:"1px solid " + G.border, borderRadius:9,
          color:G.text, fontFamily:"'Syne'", fontSize:13, padding:"10px 14px", outline:"none", cursor:"pointer",
        }}>
          <option value="">{"🌍 Tous (" + countries.length + " pays)"}</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={minConf} onChange={e => setMinConf(+e.target.value)} style={{
          flex:1, minWidth:120, background:G.card, border:"1px solid " + G.border, borderRadius:9,
          color:G.text, fontFamily:"'Syne'", fontSize:13, padding:"10px 14px", outline:"none", cursor:"pointer",
        }}>
          <option value={0}>Toutes conf.</option>
          <option value={60}>{">= 60%"}</option>
          <option value={65}>{">= 65%"}</option>
          <option value={70}>{">= 70%"}</option>
          <option value={75}>{">= 75%"}</option>
          <option value={80}>{">= 80%"}</option>
        </select>
        <button onClick={load} style={{ background:"transparent", border:"1px solid " + G.border, borderRadius:9, color:G.muted, fontFamily:"'Syne'", fontSize:13, padding:"10px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>🔄 Actualiser</button>
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign:"center", color:G.muted, padding:60 }}>Aucun match pour ces filtres</div>
        : <div className="match-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
            {filtered.map(f => <MatchCard key={f.fixture.id} fix={f} onClick={() => { setSelected(f); setPage("match"); }} />)}
          </div>
      }
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function Search({ setPage, setSelected }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const res = await get("/fixtures/today");
      const ql  = q.toLowerCase();
      setResults((res.fixtures || []).filter(f =>
        (f.teams?.home?.name || "").toLowerCase().includes(ql) ||
        (f.teams?.away?.name || "").toLowerCase().includes(ql) ||
        (f.league?.name     || "").toLowerCase().includes(ql) ||
        (f.league?.country  || "").toLowerCase().includes(ql)
      ));
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:G.accent, marginBottom:5 }}>RECHERCHE</div>
        <h1 className="page-title" style={{ fontSize:32, fontWeight:800, letterSpacing:-1 }}>Trouver un match</h1>
        <div style={{ fontSize:12, color:G.muted, marginTop:4 }}>Équipe · Ligue · Pays · Women · Division</div>
      </div>
      <div className="search-row" style={{ display:"flex", gap:10, marginBottom:24 }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
          placeholder="Arsenal, Ligue 1, Women, Championship…"
          style={{ flex:1, background:G.card, border:"1px solid " + G.border, borderRadius:10, color:G.text, fontFamily:"'Syne'", fontSize:14, padding:"13px 16px", outline:"none" }} />
        <button onClick={doSearch} style={{ background:G.accent, color:"#000", border:"none", borderRadius:10, padding:"13px 20px", fontFamily:"'Syne'", fontWeight:700, fontSize:14, cursor:"pointer", whiteSpace:"nowrap" }}>
          Rechercher
        </button>
      </div>
      {loading && <Spinner />}
      {!loading && searched && (
        results.length > 0
          ? <div className="match-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
              {results.map(f => <MatchCard key={f.fixture.id} fix={f} onClick={() => { setSelected(f); setPage("match"); }} />)}
            </div>
          : <div style={{ textAlign:"center", color:G.muted, padding:60 }}>Aucun résultat pour "{q}"</div>
      )}
    </div>
  );
}

// ─── MATCH DETAIL ─────────────────────────────────────────────────────────────
function MatchDetail({ fix, setPage }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!fix) return;
    setDetail(null); setLoading(true);
    get("/fixtures/" + fix.fixture.id + "/analysis")
      .then(setDetail).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [fix]);

  if (!fix) return <div style={{ textAlign:"center", color:G.muted, padding:60 }}>Sélectionnez un match depuis le Dashboard.</div>;

  const home = fix.teams?.home?.name || "?";
  const away = fix.teams?.away?.name || "?";
  const p    = detail?.prediction || fix.prediction || {};
  const best = p.ph >= p.pd && p.ph >= p.pa ? "home" : p.pa >= p.pd ? "away" : "draw";
  const cc   = p.conf >= 75 ? G.green : p.conf >= 65 ? G.accent : G.yellow;
  const time = fix.fixture?.date ? new Date(fix.fixture.date).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" }) : "--:--";
  const hs   = detail?.home_stats || {};
  const as_  = detail?.away_stats || {};
  const h2h  = detail?.h2h || [];

  return (
    <div className="fade">
      <button onClick={() => setPage("dashboard")} style={{ background:"transparent", border:"none", color:G.muted, cursor:"pointer", fontSize:13, fontFamily:"'Syne'", marginBottom:20 }}>← Retour</button>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:G.accent, marginBottom:5 }}>{fix.league?.country} · {fix.league?.name}</div>
        <div className="page-title" style={{ fontSize:28, fontWeight:800, letterSpacing:-1 }}>{home} <span style={{ color:G.muted, fontWeight:400 }}>vs</span> {away}</div>
        <div style={{ fontSize:12, color:G.muted, marginTop:6 }}>
          {time} · Confiance : <span style={{ color:cc, fontWeight:700 }}>{p.conf}%</span>
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrBox msg={error} /> : (
        <>
          {/* 1N2 */}
          <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:14 }}>RÉSULTAT 1 / N / 2</div>
            <div className="result-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
              {[{ l:home, v:p.ph, k:"home" }, { l:"Nul", v:p.pd, k:"draw" }, { l:away, v:p.pa, k:"away" }].map(x => (
                <div key={x.k} style={{ textAlign:"center", padding:"16px 8px", borderRadius:10,
                  background: best===x.k ? "rgba(200,255,0,.06)" : "rgba(255,255,255,.02)",
                  border:"1px solid "+(best===x.k ? "rgba(200,255,0,.35)" : "rgba(255,255,255,.06)") }}>
                  <div style={{ fontSize:10, color:G.muted, marginBottom:6 }}>{x.l.split(" ")[0]}</div>
                  <div style={{ fontSize:34, fontWeight:800, color:best===x.k ? G.accent : G.text, fontFamily:"'JetBrains Mono'" }}>{x.v}%</div>
                </div>
              ))}
            </div>
            {[{ l:home.split(" ")[0], v:p.ph, c:G.green }, { l:"Nul", v:p.pd, c:G.yellow }, { l:away.split(" ")[0], v:p.pa, c:G.red }].map(x => (
              <div key={x.l} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:80, fontSize:11, color:G.muted, textAlign:"right", flexShrink:0 }}>{x.l}</div>
                <Bar val={x.v} color={x.c} />
                <div style={{ width:36, fontSize:12, fontWeight:700, color:x.c, fontFamily:"'JetBrains Mono'", flexShrink:0 }}>{x.v}%</div>
              </div>
            ))}
          </div>

          {/* Marchés */}
          <div className="market-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {[
              { title:"OVER / UNDER 2.5", opts:[{ l:"Over 2.5", v:p.over25, c:G.accent }, { l:"Under 2.5", v:p.under25, c:G.muted }] },
              { title:"BTTS — LES DEUX MARQUENT", opts:[{ l:"Oui", v:p.btts, c:G.green }, { l:"Non", v:p.no_btts, c:G.muted }] },
            ].map(m => (
              <div key={m.title} style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:18 }}>
                <div style={{ fontSize:9, letterSpacing:2, color:G.muted, marginBottom:12 }}>{m.title}</div>
                {m.opts.map(o => (
                  <div key={o.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
                    <span style={{ fontSize:13 }}>{o.l}</span>
                    <span style={{ fontSize:20, fontWeight:800, color: o.v > 50 ? o.c : G.muted, fontFamily:"'JetBrains Mono'" }}>{o.v}%</span>
                  </div>
                ))}
                <div style={{ marginTop:10, fontSize:11, color:G.muted }}>
                  xG {home.split(" ")[0]} <span style={{ color:G.green }}>{p.xgh}</span> · xG {away.split(" ")[0]} <span style={{ color:G.red }}>{p.xga}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats saison */}
          {(hs?.fixtures || as_?.fixtures) && (
            <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:20, marginBottom:14 }}>
              <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:14 }}>STATISTIQUES DE SAISON</div>
              <div className="stat-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { label:"Buts marqués / match",  h:hs?.goals?.for?.average?.total,     a:as_?.goals?.for?.average?.total },
                  { label:"Buts encaissés / match", h:hs?.goals?.against?.average?.total, a:as_?.goals?.against?.average?.total },
                  { label:"Matchs joués",           h:hs?.fixtures?.played?.total,         a:as_?.fixtures?.played?.total },
                  { label:"Victoires",              h:hs?.fixtures?.wins?.total,           a:as_?.fixtures?.wins?.total },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize:10, color:G.muted, marginBottom:5 }}>{s.label}</div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontFamily:"'JetBrains Mono'", color:G.green, fontWeight:700 }}>{s.h || "–"}</span>
                      <span style={{ fontFamily:"'JetBrains Mono'", color:G.red, fontWeight:700 }}>{s.a || "–"}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:G.muted, marginTop:2 }}>
                      <span>{home.split(" ")[0]}</span><span>{away.split(" ")[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* H2H */}
          {h2h.length > 0 && (
            <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:20, marginBottom:14 }}>
              <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:12 }}>DERNIERS FACE-À-FACE</div>
              {h2h.slice(0,5).map(m => (
                <div key={m.fixture.id} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,.05)", fontSize:12, alignItems:"center", gap:8 }}>
                  <span style={{ color:G.muted, fontSize:10, flexShrink:0 }}>{new Date(m.fixture.date).toLocaleDateString("fr-FR")}</span>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, textAlign:"right" }}>{m.teams.home.name}</span>
                  <span style={{ fontFamily:"'JetBrains Mono'", fontWeight:700, color:G.accent, flexShrink:0 }}>{m.goals.home}-{m.goals.away}</span>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{m.teams.away.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Score */}
          <div style={{ background:"rgba(255,214,0,.03)", border:"1px solid rgba(255,214,0,.2)", borderRadius:14, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:8 }}>SCORE LE PLUS PROBABLE</div>
            <div style={{ fontSize:64, fontWeight:800, color:G.yellow, fontFamily:"'JetBrains Mono'", letterSpacing:6 }}>{p.score}</div>
            <div style={{ fontSize:11, color:G.muted, marginTop:8 }}>Indicatif uniquement — précision réelle ~10–15%</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── COMPARE ──────────────────────────────────────────────────────────────────
function Compare() {
  const [homeQ, setHomeQ]     = useState("");
  const [awayQ, setAwayQ]     = useState("");
  const [homeRes, setHomeRes] = useState([]);
  const [awayRes, setAwayRes] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const searchTeam = async (q, setter) => {
    if (!q.trim()) return;
    try { const r = await get("/teams/search?q=" + encodeURIComponent(q)); setter(r.teams || []); }
    catch {}
  };

  const analyze = async () => {
    if (!homeTeam || !awayTeam) return;
    setLoading(true);
    try { setResult(await get("/compare?home_id=" + homeTeam.id + "&away_id=" + awayTeam.id)); }
    catch { setResult(null); }
    finally { setLoading(false); }
  };

  const iStyle = { flex:1, background:G.card, border:"1px solid " + G.border, borderRadius:9, color:G.text, fontFamily:"'Syne'", fontSize:13, padding:"11px 14px", outline:"none" };
  const bStyle = { background:G.accent, color:"#000", border:"none", borderRadius:9, padding:"11px 14px", fontFamily:"'Syne'", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" };

  const TeamSearch = ({ label, q, setQ, res, setRes, team, setTeam, borderColor }) => (
    <div>
      <div style={{ fontSize:10, letterSpacing:2, color:G.muted, marginBottom:6 }}>{label}</div>
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && searchTeam(q, setRes)}
          placeholder="Chercher une équipe…" style={iStyle} />
        <button onClick={() => searchTeam(q, setRes)} style={bStyle}>🔍</button>
      </div>
      {res.map(r => (
        <div key={r.team.id} onClick={() => { setTeam(r.team); setRes([]); }} style={{
          padding:"8px 12px", background: team?.id === r.team.id ? "rgba(200,255,0,.08)" : G.card,
          border:"1px solid " + G.border, borderRadius:8, cursor:"pointer", fontSize:13, marginBottom:4,
          display:"flex", alignItems:"center", gap:8,
        }}>
          {r.team.logo && <img src={r.team.logo} style={{ width:16, height:16, objectFit:"contain" }} alt="" onError={e => { e.target.style.display="none"; }} />}
          {r.team.name} <span style={{ fontSize:10, color:G.muted }}>({r.team.country})</span>
        </div>
      ))}
      {team && <div style={{ marginTop:6, fontSize:12, color:borderColor }}>✓ {team.name}</div>}
    </div>
  );

  return (
    <div className="fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:G.accent, marginBottom:5 }}>COMPARAISON</div>
        <h1 className="page-title" style={{ fontSize:32, fontWeight:800, letterSpacing:-1 }}>Comparer deux équipes</h1>
      </div>

      <div className="compare-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <TeamSearch label="🏠 DOMICILE" q={homeQ} setQ={setHomeQ} res={homeRes} setRes={setHomeRes} team={homeTeam} setTeam={setHomeTeam} borderColor={G.green} />
        <TeamSearch label="✈️ EXTÉRIEUR" q={awayQ} setQ={setAwayQ} res={awayRes} setRes={setAwayRes} team={awayTeam} setTeam={setAwayTeam} borderColor={G.red} />
      </div>

      {homeTeam && awayTeam && (
        <button onClick={analyze} style={{ ...bStyle, width:"100%", padding:"14px", fontSize:15, marginBottom:24 }}>
          Analyser ce face-à-face
        </button>
      )}

      {loading && <Spinner />}
      {result && !loading && (() => {
        const p   = result.prediction;
        const h2h = result.h2h || [];
        return (
          <div style={{ display:"grid", gap:14 }}>
            <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:20 }}>
              <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:14 }}>PRÉDICTION 1/N/2</div>
              <div className="result-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[{ l:homeTeam?.name || "Dom.", v:p.ph, c:G.green }, { l:"Nul", v:p.pd, c:G.yellow }, { l:awayTeam?.name || "Ext.", v:p.pa, c:G.red }].map(x => (
                  <div key={x.l} style={{ textAlign:"center", padding:"16px 8px", background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.07)", borderRadius:10 }}>
                    <div style={{ fontSize:9, color:G.muted, marginBottom:6 }}>{x.l.split(" ")[0]}</div>
                    <div style={{ fontSize:34, fontWeight:800, color:x.c, fontFamily:"'JetBrains Mono'" }}>{x.v}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="market-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[{ t:"Over 2.5", v:p.over25, c:G.accent }, { t:"BTTS", v:p.btts, c:G.green }].map(x => (
                <div key={x.t} style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:20, textAlign:"center" }}>
                  <div style={{ fontSize:9, letterSpacing:2, color:G.muted, marginBottom:10 }}>{x.t}</div>
                  <div style={{ fontSize:44, fontWeight:800, color:x.c, fontFamily:"'JetBrains Mono'" }}>{x.v}%</div>
                </div>
              ))}
            </div>
            <div style={{ background:"rgba(255,214,0,.03)", border:"1px solid rgba(255,214,0,.2)", borderRadius:14, padding:20, textAlign:"center" }}>
              <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:6 }}>SCORE PROBABLE</div>
              <div style={{ fontSize:52, fontWeight:800, color:G.yellow, fontFamily:"'JetBrains Mono'" }}>{p.score}</div>
            </div>
            {h2h.length > 0 && (
              <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, padding:20 }}>
                <div style={{ fontSize:10, letterSpacing:3, color:G.muted, marginBottom:12 }}>DERNIERS FACE-À-FACE</div>
                {h2h.slice(0,5).map(m => (
                  <div key={m.fixture.id} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,.05)", fontSize:12, alignItems:"center", gap:6 }}>
                    <span style={{ color:G.muted, fontSize:10, flexShrink:0 }}>{new Date(m.fixture.date).toLocaleDateString("fr-FR")}</span>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, textAlign:"right" }}>{m.teams.home.name}</span>
                    <span style={{ fontFamily:"'JetBrains Mono'", fontWeight:700, color:G.accent, flexShrink:0 }}>{m.goals.home}-{m.goals.away}</span>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{m.teams.away.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── STANDINGS ────────────────────────────────────────────────────────────────
function Standings() {
  const LEAGUES = [
    { id:39,  name:"PL 🏴" },      { id:40,  name:"Champ. 🏴" },
    { id:41,  name:"L.One 🏴" },   { id:42,  name:"L.Two 🏴" },
    { id:61,  name:"L1 🇫🇷" },     { id:62,  name:"L2 🇫🇷" },
    { id:78,  name:"BL1 🇩🇪" },    { id:79,  name:"BL2 🇩🇪" },
    { id:140, name:"LaLiga 🇪🇸" }, { id:141, name:"LaLiga2 🇪🇸" },
    { id:135, name:"SerieA 🇮🇹" }, { id:136, name:"SerieB 🇮🇹" },
    { id:94,  name:"Liga 🇵🇹" },   { id:88,  name:"Erediv. 🇳🇱" },
    { id:203, name:"Süper 🇹🇷" },  { id:2,   name:"UCL 🌍" },
    { id:3,   name:"UEL 🌍" },     { id:848, name:"UECL 🌍" },
  ];
  const [selId, setSelId]     = useState(39);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true); setError(null); setData(null);
    get("/standings/" + selId)
      .then(r => setData(r.standings?.[0] || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selId]);

  return (
    <div className="fade">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:G.accent, marginBottom:5 }}>CLASSEMENTS</div>
        <h1 className="page-title" style={{ fontSize:32, fontWeight:800, letterSpacing:-1 }}>Classements en direct</h1>
      </div>

      <div className="league-tabs" style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
        {LEAGUES.map(l => (
          <button key={l.id} className="league-tab" onClick={() => setSelId(l.id)} style={{
            padding:"6px 12px", borderRadius:8, fontSize:12,
            border:"1px solid " + (selId === l.id ? G.accent : G.border),
            background: selId === l.id ? "rgba(200,255,0,.08)" : "transparent",
            color: selId === l.id ? G.accent : G.muted,
            cursor:"pointer", fontFamily:"'Syne'", transition:"all .15s", whiteSpace:"nowrap",
          }}>{l.name}</button>
        ))}
      </div>

      {loading && <Spinner />}
      {error   && <ErrBox msg={error} />}
      {!loading && !error && data && data.length > 0 && (
        <div style={{ background:G.card, border:"1px solid " + G.border, borderRadius:14, overflow:"hidden" }}>
          <div className="standings-header" style={{ display:"grid", gridTemplateColumns:"32px 1fr 40px 40px 40px 40px 50px 50px", padding:"10px 16px", borderBottom:"1px solid " + G.border, fontSize:9, letterSpacing:2, color:G.muted }}>
            <span>#</span><span>ÉQUIPE</span>
            <span style={{ textAlign:"center" }}>J</span>
            <span style={{ textAlign:"center" }}>V</span>
            <span style={{ textAlign:"center" }}>N</span>
            <span style={{ textAlign:"center" }}>D</span>
            <span style={{ textAlign:"center" }}>GD</span>
            <span style={{ textAlign:"right" }}>PTS</span>
          </div>
          {data.map((s, i) => {
            const gd = s.goalsDiff || 0;
            return (
              <div key={i} className="standings-row" style={{
                display:"grid", gridTemplateColumns:"32px 1fr 40px 40px 40px 40px 50px 50px",
                padding:"11px 16px", borderBottom:"1px solid rgba(255,255,255,.04)", alignItems:"center",
                background: i < 4 ? "rgba(200,255,0,.015)" : i < 6 ? "rgba(79,168,255,.01)" : "transparent",
              }}>
                <span style={{ fontSize:12, color:i<3?G.accent:G.muted, fontWeight:i<3?700:400, fontFamily:"'JetBrains Mono'" }}>{s.rank}</span>
                <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
                  {s.team?.logo && <img src={s.team.logo} style={{ width:16, height:16, objectFit:"contain", flexShrink:0 }} alt="" onError={e => { e.target.style.display="none"; }} />}
                  <span style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.team?.name}</span>
                </div>
                <span style={{ textAlign:"center", fontSize:11, color:G.muted }}>{s.all?.played}</span>
                <span style={{ textAlign:"center", fontSize:11, color:G.green }}>{s.all?.win}</span>
                <span style={{ textAlign:"center", fontSize:11, color:G.yellow }}>{s.all?.draw}</span>
                <span style={{ textAlign:"center", fontSize:11, color:G.red }}>{s.all?.lose}</span>
                <span style={{ textAlign:"center", fontSize:11, color:gd>0?G.green:gd<0?G.red:G.muted, fontFamily:"'JetBrains Mono'" }}>{gd>0?"+":""}{gd}</span>
                <span style={{ textAlign:"right", fontSize:14, fontWeight:800, color:G.accent, fontFamily:"'JetBrains Mono'" }}>{s.points}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile                = useIsMobile();

  const pages = {
    dashboard: <Dashboard setPage={setPage} setSelected={setSelected} isMobile={isMobile} />,
    search:    <Search setPage={setPage} setSelected={setSelected} />,
    match:     <MatchDetail fix={selected} setPage={setPage} />,
    compare:   <Compare />,
    standings: <Standings />,
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", minHeight:"100vh", background:G.bg }}>
        <Sidebar page={page} setPage={setPage} isMobile={isMobile} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <main style={{
          flex:1,
          padding: isMobile ? "72px 14px 90px" : "40px 36px",
          overflowY:"auto",
          maxHeight: isMobile ? "100dvh" : "100vh",
          width: isMobile ? "100%" : "auto",
        }}>
          <div key={page}>{pages[page]}</div>
        </main>
      </div>
    </>
  );
}
