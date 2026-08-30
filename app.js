/* De La Rosa Masters — Shared application logic (app.js)
 * Loaded by every page. Provides:
 *  - State persistence (localStorage)
 *  - Auth modal (User / Admin) shared across pages
 *  - Shared header with role badge + status + nav
 *  - Core helpers (handicap, totals, player order, team map)
 *  - Cross-page navigation
 */
(function(){
  'use strict';

  const STORAGE_KEY = 'bowlingTournamentManager_v5';
  const ADMIN_PASS = 'B0l1ch3b1ll4r';

  /* ---------- State ---------- */
  function defaultState(){
    return {
      teams: [],
      settings: { totalLanes: 30, satGames: 4, sunGames: 3 },
      games: [],
      currentGame: 1,
      started: false
    };
  }

  function loadState(){
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(s){
        if(!s.settings) s.settings = { totalLanes: 30, satGames: 4, sunGames: 3 };
        if(!s.settings.totalLanes) s.settings.totalLanes = 30;
        if(!s.settings.satGames) s.settings.satGames = 4;
        if(!s.settings.sunGames) s.settings.sunGames = 3;
        if(!s.currentGame) s.currentGame = 1;
        if(!Array.isArray(s.teams)) s.teams = [];
        if(!Array.isArray(s.games)) s.games = [];
        return s;
      }
      return defaultState();
    } catch(e){ return defaultState(); }
  }

  let state = loadState();
  let isAdmin = false;

  /* ---------- Persistence ---------- */
  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const onState = window.onStateSaved;
    if(typeof onState === 'function') onState();
    updateHeaderStatus();
  }

  function getState(){ return state; }
  function setState(next){ state = next; }
  function getIsAdmin(){ return isAdmin; }
  function setIsAdmin(v){ isAdmin = v; }

  /* ---------- Helpers ---------- */
  function esc(s){
    return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function handicap(avg, gender){
    const cap = (gender==='Female'||gender==='Female Senior') ? 40 : 35;
    return Math.max(0, Math.min(cap, 210 - avg));
  }

  function totalAvg(team){ return team.bowlers.reduce((a,b)=>a+b.average,0); }
  function teamTotals(t){ return t.bowlers.reduce((o,b)=>({avg:o.avg+b.average,hdcp:o.hdcp+b.handicap}),{avg:0,hdcp:0}); }
  function playerOrder(team){ return [...team.bowlers].sort((a,b)=>a.average-b.average || a.name.localeCompare(b.name)); }
  function teamMap(){ return Object.fromEntries(state.teams.map(t=>[t.id,t])); }

  /* ---------- Auth modal ---------- */
  function showAdminPrompt(){
    const f = document.getElementById('adminForm');
    if(f) f.style.display = 'block';
  }

  function selectUserRole(){
    isAdmin = false;
    document.body.classList.remove('is-admin');
    const rb = document.getElementById('roleBadge');
    if(rb) rb.textContent = 'Mode: User (Audit View)';
    const m = document.getElementById('authModal');
    if(m) m.style.display = 'none';
    afterAuth('game');
  }

  function loginAdmin(){
    const pass = document.getElementById('adminPass')?.value;
    if(pass === ADMIN_PASS){
      isAdmin = true;
      document.body.classList.add('is-admin');
      const rb = document.getElementById('roleBadge');
      if(rb) rb.textContent = 'Mode: Admin';
      const m = document.getElementById('authModal');
      if(m) m.style.display = 'none';
      afterAuth('registration');
    } else {
      const a = document.getElementById('authAlert');
      if(a) a.innerHTML = '<div class="alert alert-danger">Incorrect password</div>';
    }
  }

  function afterAuth(defaultTab){
    if(typeof window.onAuthSuccess === 'function'){
      window.onAuthSuccess();
    } else if(typeof window.renderAll === 'function'){
      window.renderAll();
    }
    updateHeaderStatus();
  }

  function promptEraseEverything(){
    const pass = prompt("WARNING: This will erase everything and start over. Please enter the admin password to confirm:");
    if(pass === null) return;
    if(pass === ADMIN_PASS){
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      isAdmin = false;
      document.body.classList.remove('is-admin');
      const rb = document.getElementById('roleBadge');
      if(rb) rb.textContent = 'Mode: User';
      const m = document.getElementById('authModal');
      if(m) m.style.display = 'flex';
      const ap = document.getElementById('adminPass');
      if(ap) ap.value = '';
      const aa = document.getElementById('authAlert');
      if(aa) aa.innerHTML = '';
      save();
    } else {
      alert('Incorrect admin password. Action cancelled.');
    }
  }

  /* ---------- Shared header builder ---------- */
  function buildHeader(activePage){
    const navItems = [
      { key:'index', label:'Home', href:'index.html' },
      { key:'registration', label:'Team Registration', href:'team-registration.html', admin:true },
      { key:'setup', label:'Tournament Setup', href:'tournament-setup.html', admin:true },
      { key:'game', label:'Current Game', href:'current-game.html' },
      { key:'standings', label:'Standings', href:'standings.html' }
    ];

    const navHtml = navItems.map(it=>{
      const active = it.key === activePage ? ' active' : '';
      const cls = 'tab' + (it.admin ? ' admin-only' : '') + active;
      return `<a href="${it.href}" class="${cls}">${it.label}</a>`;
    }).join('');

    return `
    <div id="authModal">
      <div class="auth-card">
        <h2 style="font-size:1.5rem;margin-bottom:8px">DE LA ROSA MASTERS</h2>
        <p class="muted" style="margin-bottom:20px">Select access mode to continue</p>
        <button class="role-btn btn-primary" onclick="App.selectUserRole()">User Access (View / Audit)</button>
        <button class="role-btn btn-secondary" onclick="App.showAdminPrompt()">Admin Access</button>
        <div id="adminForm" style="display:none;margin-top:16px">
          <label for="adminPass">Enter Password</label>
          <input type="password" id="adminPass" placeholder="········" style="margin-bottom:10px">
          <div id="authAlert"></div>
          <button class="btn-primary" style="width:100%" onclick="App.loginAdmin()">Login as Admin</button>
        </div>
      </div>
    </div>

    <header>
      <div class="header-inner">
        <div class="brand-wrapper">
          <svg class="brand-logo" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
            <path d="M 120 180 C 120 70, 380 70, 380 180 C 380 340, 120 340, 120 180 Z" fill="#000" stroke="#ffd700" stroke-width="8"/>
            <path d="M 80 100 Q 250 40 420 100 Q 450 200 420 280 Q 250 380 80 280 Q 50 200 80 100 Z" fill="none" stroke="#ff2a1a" stroke-width="14"/>
            <path d="M 100 80 Q 250 30 400 80 L 380 120 Q 250 80 120 120 Z" fill="#ff2a1a" stroke="#ffd700" stroke-width="3"/>
            <text x="250" y="70" font-family="Arial Black, sans-serif" font-size="24" fill="#ffd700" text-anchor="middle" font-style="italic">DE LA ROSA</text>
            <circle cx="250" cy="100" r="14" fill="#ff2a1a"/>
            <path d="M 245 100 Q 250 90 255 100 Q 250 110 245 100" fill="#ffd700"/>
            <rect x="70" y="140" width="360" height="90" rx="15" fill="#e6e6e6" stroke="#000" stroke-width="8"/>
            <text x="250" y="210" font-family="Impact, Arial Black" font-size="70" fill="#000" text-anchor="middle" font-weight="bold">MASTERS</text>
            <circle cx="250" cy="270" r="45" fill="#ff2a1a"/>
            <circle cx="240" cy="260" r="5" fill="#fff"/>
            <circle cx="260" cy="260" r="5" fill="#fff"/>
            <circle cx="250" cy="275" r="5" fill="#fff"/>
            <text x="250" y="335" font-family="Brush Script MT, cursive, sans-serif" font-size="22" fill="#fff" text-anchor="middle">ilusión Bowl</text>
            <polygon points="250,345 255,360 270,360 257,370 262,385 250,375 238,385 243,370 230,360 245,360" fill="#ff2a1a"/>
          </svg>
          <div>
            <div class="brand">DE LA ROSA <span>MASTERS</span></div>
            <div class="subtitle">ILUSIÓN BOWL • Registration & Shifts Manager</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn-danger admin-only" style="padding:6px 12px;font-size:0.75rem;" onclick="App.promptEraseEverything()">Erase & Start Over</button>
          <div id="roleBadge" class="badge" style="background:#000">Mode: User</div>
          <div id="headerStatus" class="badge">7 games • Shifts 1, 2, 3</div>
        </div>
      </div>
      <div class="header-inner" style="margin-top:10px">
        <nav class="tabs" style="margin:0">${navHtml}</nav>
      </div>
    </header>`;
  }

  function updateHeaderStatus(){
    const el = document.getElementById('headerStatus');
    if(!el) return;
    const s = state.settings;
    el.textContent = `${s.satGames + s.sunGames} games • Lanes: ${s.totalLanes}`;
  }

  /* ---------- Page bootstrapping ---------- */
  function mountPage(activePage){
    const headerHost = document.getElementById('header-host');
    if(headerHost) headerHost.innerHTML = buildHeader(activePage);
    updateHeaderStatus();
    // wire auth modal enter key
    const ap = document.getElementById('adminPass');
    if(ap) ap.addEventListener('keydown', e=>{ if(e.key==='Enter') loginAdmin(); });

    // Restore an admin session if previously granted in this browser session
    // (admin is session-scoped via sessionStorage flag to avoid exposing password)
    if(sessionStorage.getItem('dlrm_admin') === '1'){
      isAdmin = true;
      document.body.classList.add('is-admin');
      const rb = document.getElementById('roleBadge');
      if(rb) rb.textContent = 'Mode: Admin';
      const m = document.getElementById('authModal');
      if(m) m.style.display = 'none';
      if(typeof window.onAuthSuccess === 'function') window.onAuthSuccess();
      else if(typeof window.renderAll === 'function') window.renderAll();
    }
  }

  // Keep admin flag in sync across pages via sessionStorage
  const _origLogin = loginAdmin;
  loginAdmin = function(){
    _origLogin();
    if(isAdmin) sessionStorage.setItem('dlrm_admin','1');
  };
  const _origUser = selectUserRole;
  selectUserRole = function(){
    sessionStorage.removeItem('dlrm_admin');
    _origUser();
  };
  const _origErase = promptEraseEverything;
  promptEraseEverything = function(){
    const before = isAdmin;
    _origErase();
    if(!isAdmin) sessionStorage.removeItem('dlrm_admin');
  };

  /* ---------- Public API ---------- */
  window.App = {
    STORAGE_KEY,
    getState, setState, save,
    getIsAdmin, setIsAdmin,
    esc, handicap, totalAvg, teamTotals, playerOrder, teamMap,
    showAdminPrompt, selectUserRole, loginAdmin, promptEraseEverything,
    mountPage, updateHeaderStatus, defaultState
  };
})();
