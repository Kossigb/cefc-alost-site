// ════════════════════════════════════════
//  CEFC Alost — Admin Dashboard
//  Auth: Netlify Identity | Save: GitHub API
// ════════════════════════════════════════

const REPO        = 'kossigb/cefc-alost-site';
const BRANCH      = 'main';
const SUPER_ADMIN = 'chrisgbev2005@gmail.com';
const SESSION_MAX = 7 * 24 * 60 * 60 * 1000; // 1 semaine en ms

let contenu    = {};
let photosData = { photos: [] };

// ════════════ AUTH ════════════

function enableLoginBtn() {
  const btn = document.getElementById('login-btn');
  const hint = document.getElementById('login-hint');
  if (btn && btn.disabled) {
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.pointerEvents = '';
    btn.style.cursor = '';
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>Se connecter avec mon email`;
  }
  if (hint) hint.style.visibility = '';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.netlifyIdentity) {
    document.getElementById('login-screen').innerHTML =
      '<div style="color:#fca5a5;text-align:center;padding:40px">Netlify Identity non disponible.<br>Vérifiez votre connexion.</div>';
    return;
  }

  // Safety timeout: if init hasn't fired after 5 seconds, show login button anyway
  const initTimeout = setTimeout(() => enableLoginBtn(), 5000);

  window.netlifyIdentity.on('init', user => {
    clearTimeout(initTimeout);
    if (user) { showApp(user); } else { enableLoginBtn(); }
  });
  window.netlifyIdentity.on('login', user => {
    localStorage.setItem('cefc_login_time', Date.now().toString());
    window.netlifyIdentity.close();
    showApp(user);
  });
  window.netlifyIdentity.on('logout', () => {
    document.getElementById('admin-app').classList.remove('open');
    document.getElementById('login-screen').style.display = 'flex';
    enableLoginBtn();
  });
});

function openLogin() {
  if (!window.netlifyIdentity) return;
  // If already authenticated, go straight to the app without opening the widget
  const user = window.netlifyIdentity.currentUser();
  if (user) { showApp(user); return; }
  window.netlifyIdentity.open('login');
}

function doLogout() {
  localStorage.removeItem('cefc_login_time');
  window.netlifyIdentity && window.netlifyIdentity.logout();
}

async function showApp(user) {
  // Session expiry: 1 semaine
  const loginTime = parseInt(localStorage.getItem('cefc_login_time') || '0');
  if (loginTime && (Date.now() - loginTime) > SESSION_MAX) {
    localStorage.removeItem('cefc_login_time');
    window.netlifyIdentity && window.netlifyIdentity.logout();
    return;
  }

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.add('open');
  document.getElementById('admin-username').textContent = user.email || 'Admin';

  // Gestion utilisateurs : réservé au super-admin uniquement
  const isAdmin = user.email === SUPER_ADMIN;
  const userNav = document.querySelector('.nav-item[data-page="utilisateurs"]');
  if (userNav) userNav.style.display = isAdmin ? '' : 'none';

  setupNav();
  await Promise.all([loadContent(), loadPhotosData()]);
  populateAll();
  showCurrentUser(user);
  if (isAdmin) loadUsers();
  refreshTokenStatus();
}

// ════════════ GITHUB API ════════════

function getGHToken() { return localStorage.getItem('cefc_gh_token') || ''; }
function saveGHToken(t) { localStorage.setItem('cefc_gh_token', t.trim()); }

async function ghGetSHA(path) {
  const token = getGHToken();
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return null;
    return (await res.json()).sha;
  } catch { return null; }
}

async function ghCommitText(path, content, message) {
  const token = getGHToken();
  if (!token) throw new Error('no-token');
  const sha = await ghGetSHA(path);
  const body = { message, branch: BRANCH, content: btoa(unescape(encodeURIComponent(content))) };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Erreur ${res.status}`); }
}

async function ghCommitBinary(path, base64, message) {
  const token = getGHToken();
  if (!token) throw new Error('no-token');
  const sha = await ghGetSHA(path);
  const body = { message, branch: BRANCH, content: base64 };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Erreur ${res.status}`); }
}

async function testAndSaveToken() {
  const input = document.getElementById('gh-token-input');
  const status = document.getElementById('gh-token-status');
  const token = input.value.trim();
  if (!token) { status.textContent = 'Entrez un token.'; status.style.color = '#fca5a5'; return; }
  status.textContent = 'Vérification...'; status.style.color = 'var(--text2)';
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      saveGHToken(token);
      status.textContent = '✓ Token valide — connexion GitHub établie !';
      status.style.color = '#6ee7b7';
      input.value = '';
      refreshTokenStatus();
      toast('Token GitHub enregistré !', 'success');
    } else {
      status.textContent = '✗ Token invalide ou accès refusé.';
      status.style.color = '#fca5a5';
    }
  } catch { status.textContent = '✗ Erreur réseau.'; status.style.color = '#fca5a5'; }
}

function refreshTokenStatus() {
  const el = document.getElementById('gh-token-badge');
  if (!el) return;
  const t = getGHToken();
  el.textContent = t ? '✓ Token configuré' : '⚠ Token non configuré';
  el.style.color  = t ? '#6ee7b7' : '#fcd34d';
}

function clearToken() {
  localStorage.removeItem('cefc_gh_token');
  refreshTokenStatus();
  toast('Token supprimé.', 'success');
}

// ════════════ SAVE ALL → GITHUB ════════════

async function saveAll() {
  document.querySelectorAll('[data-path]').forEach(el => {
    setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value);
  });
  if (!getGHToken()) {
    toast('⚠ Token GitHub requis — configurez-le dans ⚙ Paramètres.', 'error');
    switchPage('parametres'); return;
  }
  const btns = document.querySelectorAll('.save-btn');
  btns.forEach(b => { b._orig = b.textContent; b.textContent = '⏳ Publication…'; b.disabled = true; });
  try {
    await ghCommitText('contenu.json', JSON.stringify(contenu, null, 2), 'Mise à jour contenu via admin CEFC');
    toast('✓ Modifications publiées ! Le site se met à jour automatiquement.', 'success');
  } catch (e) {
    toast(e.message === 'no-token' ? 'Token GitHub manquant.' : 'Erreur GitHub : ' + e.message, 'error');
  } finally {
    btns.forEach(b => { b.textContent = b._orig; b.disabled = false; });
  }
}

function switchPage(name) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${name}"]`);
  const pgEl  = document.getElementById(`page-${name}`);
  if (navEl) navEl.classList.add('active');
  if (pgEl)  pgEl.classList.add('active');
}

// ════════════ NAVIGATION ════════════

function setupNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('page-' + item.dataset.page).classList.add('active');
      document.getElementById('sidebar').classList.remove('mobile-open');
      // Lazy-load photos on first visit
      if (item.dataset.page === 'photos') renderPhotosGrid();
    });
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

// ════════════ LOAD DATA ════════════

async function loadContent() {
  try {
    const r = await fetch('/contenu.json?t=' + Date.now());
    contenu = await r.json();
  } catch { toast('Impossible de charger contenu.json', 'error'); contenu = {}; }
}

async function loadPhotosData() {
  try {
    const r = await fetch('/photos_culte.json?t=' + Date.now());
    photosData = await r.json();
  } catch { photosData = { photos: [] }; }
}

// ════════════ POPULATE FIELDS ════════════

function populateAll() {
  document.querySelectorAll('[data-path]').forEach(el => {
    const val = getPath(contenu, el.dataset.path);
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = val || '';
    el.addEventListener('input',  () => setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value));
    el.addEventListener('change', () => setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value));
  });
  renderAnnonces();
  renderHoraires();
  renderNavette();
  renderDepts();
  renderEquipe();
  renderTemoignages();
}

// ════════════ HORAIRES ════════════

function renderHoraires() {
  const days = [
    { key: 'dimanche', label: 'Dimanche', icon: '☀️' },
    { key: 'mercredi', label: 'Mercredi', icon: '📖' },
    { key: 'vendredi', label: 'Vendredi', icon: '🙏' }
  ];
  const el = document.getElementById('horaires-content');
  el.innerHTML = days.map(d => {
    const b = `horaires.${d.key}`;
    return `
    <div class="card">
      <div class="card-title">${d.icon} ${d.label}</div>
      <div class="field"><label>Heure</label><input type="text" data-path="${b}.heure" value="${esc(getPath(contenu,b+'.heure'))}" /></div>
      <div class="grid3">
        <div class="field"><label>Nom <span class="lang lang-fr">FR</span></label><input type="text" data-path="${b}.nom"    value="${esc(getPath(contenu,b+'.nom'))}" /></div>
        <div class="field"><label>Nom <span class="lang lang-nl">NL</span></label><input type="text" data-path="${b}.nom_nl" value="${esc(getPath(contenu,b+'.nom_nl'))}" /></div>
        <div class="field"><label>Nom <span class="lang lang-en">EN</span></label><input type="text" data-path="${b}.nom_en" value="${esc(getPath(contenu,b+'.nom_en'))}" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea data-path="${b}.description">${esc(getPath(contenu,b+'.description'))}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea data-path="${b}.description_nl">${esc(getPath(contenu,b+'.description_nl'))}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea data-path="${b}.description_en">${esc(getPath(contenu,b+'.description_en'))}</textarea></div>
    </div>`;
  }).join('');
  el.querySelectorAll('[data-path]').forEach(bindField);
}

// ════════════ ANNONCES ════════════

function renderAnnonces() {
  const list = contenu.annonces?.liste || [];
  const el = document.getElementById('annonces-list');
  if (!list.length) { el.innerHTML = '<p style="color:var(--text2);font-size:14px;margin-bottom:16px">Aucune annonce.</p>'; return; }
  el.innerHTML = list.map((a, i) => `
    <div class="list-item">
      <div class="list-item-head"><h4>📌 ${esc(a.titre||'Sans titre')}</h4><button class="btn-del" onclick="removeAnnonce(${i})">🗑️ Supprimer</button></div>
      <div class="grid2">
        <div class="field"><label>Titre <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(a.titre||'')}" onchange="contenu.annonces.liste[${i}].titre=this.value" /></div>
        <div class="field"><label>Date</label><input type="text" value="${esc(a.date||'')}" placeholder="ex: 15 juin 2026" onchange="contenu.annonces.liste[${i}].date=this.value" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.annonces.liste[${i}].description=this.value">${esc(a.description||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.annonces.liste[${i}].description_nl=this.value">${esc(a.description_nl||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea onchange="contenu.annonces.liste[${i}].description_en=this.value">${esc(a.description_en||'')}</textarea></div>
      <div class="field"><label>Image (URL)</label><input type="text" value="${esc(a.image||'')}" placeholder="/img/uploads/photo.jpg" onchange="contenu.annonces.liste[${i}].image=this.value" /></div>
      <div class="toggle-row" style="margin-top:8px">
        <label>À la une</label>
        <label class="toggle"><input type="checkbox" ${a.important?'checked':''} onchange="contenu.annonces.liste[${i}].important=this.checked" /><span class="toggle-slider"></span></label>
      </div>
    </div>`).join('');
}
function addAnnonce() {
  if (!contenu.annonces) contenu.annonces = { liste: [] };
  contenu.annonces.liste.unshift({ titre:'Nouvelle annonce', date:'', description:'', description_nl:'', description_en:'', image:'', important:false });
  renderAnnonces();
}
function removeAnnonce(i) {
  if (!confirm('Supprimer cette annonce ?')) return;
  contenu.annonces.liste.splice(i, 1); renderAnnonces();
}

// ════════════ NAVETTE ════════════

function renderNavette() {
  const list = contenu.navette?.creneaux || [];
  const el = document.getElementById('navette-list');
  el.innerHTML = list.map((c, i) => `
    <div class="list-item">
      <div class="list-item-head"><h4>🚌 ${esc(c.jour||'')} — ${esc(c.horaire||'')}</h4><button class="btn-del" onclick="removeNavette(${i})">🗑️</button></div>
      <div class="grid3">
        <div class="field"><label>Jour <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(c.jour||'')}" onchange="contenu.navette.creneaux[${i}].jour=this.value" /></div>
        <div class="field"><label>Jour <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(c.jour_nl||'')}" onchange="contenu.navette.creneaux[${i}].jour_nl=this.value" /></div>
        <div class="field"><label>Jour <span class="lang lang-en">EN</span></label><input type="text" value="${esc(c.jour_en||'')}" onchange="contenu.navette.creneaux[${i}].jour_en=this.value" /></div>
        <div class="field"><label>Horaire <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(c.horaire||'')}" onchange="contenu.navette.creneaux[${i}].horaire=this.value" /></div>
        <div class="field"><label>Horaire <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(c.horaire_nl||'')}" onchange="contenu.navette.creneaux[${i}].horaire_nl=this.value" /></div>
        <div class="field"><label>Horaire <span class="lang lang-en">EN</span></label><input type="text" value="${esc(c.horaire_en||c.horaire||'')}" onchange="contenu.navette.creneaux[${i}].horaire_en=this.value" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.navette.creneaux[${i}].description=this.value">${esc(c.description||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.navette.creneaux[${i}].description_nl=this.value">${esc(c.description_nl||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea onchange="contenu.navette.creneaux[${i}].description_en=this.value">${esc(c.description_en||'')}</textarea></div>
    </div>`).join('');
}
function addNavette() {
  if (!contenu.navette) contenu.navette = { creneaux: [] };
  contenu.navette.creneaux.push({ jour:'Dimanche', jour_nl:'Zondag', jour_en:'Sunday', horaire:'', horaire_nl:'', horaire_en:'', description:'', description_nl:'', description_en:'', principal:true });
  renderNavette();
}
function removeNavette(i) {
  if (!confirm('Supprimer ce créneau ?')) return;
  contenu.navette.creneaux.splice(i, 1); renderNavette();
}

// ════════════ DÉPARTEMENTS ════════════

function renderDepts() {
  const list = contenu.departements?.liste || [];
  const el = document.getElementById('dept-list');
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = list.map((d, i) => `
    <div class="list-item">
      <div class="list-item-head"><h4>🏢 ${esc(d.nom||'Sans nom')}</h4><button class="btn-del" onclick="removeDept(${i})">🗑️ Supprimer</button></div>
      <div class="grid2">
        <div class="field"><label>ID</label><input type="text" value="${esc(d.id||'')}" onchange="contenu.departements.liste[${i}].id=this.value" /></div>
        <div class="field"><label>Photo (fichier)</label><input type="text" value="${esc(d.photo||'')}" placeholder="chorale.jpg" onchange="contenu.departements.liste[${i}].photo=this.value" /></div>
      </div>
      <div class="grid3">
        <div class="field"><label>Nom <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(d.nom||'')}" onchange="contenu.departements.liste[${i}].nom=this.value" /></div>
        <div class="field"><label>Nom <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(d.nom_nl||'')}" onchange="contenu.departements.liste[${i}].nom_nl=this.value" /></div>
        <div class="field"><label>Nom <span class="lang lang-en">EN</span></label><input type="text" value="${esc(d.nom_en||'')}" onchange="contenu.departements.liste[${i}].nom_en=this.value" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.departements.liste[${i}].description=this.value">${esc(d.description||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.departements.liste[${i}].description_nl=this.value">${esc(d.description_nl||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea onchange="contenu.departements.liste[${i}].description_en=this.value">${esc(d.description_en||'')}</textarea></div>
    </div>`).join('');
}
function addDept() {
  if (!contenu.departements) contenu.departements = { liste: [] };
  contenu.departements.liste.push({ id:'nouveau', nom:'Nouveau', nom_nl:'Nieuw', nom_en:'New', description:'', description_nl:'', description_en:'', photo:'' });
  renderDepts();
}
function removeDept(i) {
  if (!confirm('Supprimer ce département ?')) return;
  contenu.departements.liste.splice(i, 1); renderDepts();
}

// ════════════ ÉQUIPE ════════════

function renderEquipe() {
  const list = contenu.equipe_pastorale?.membres || [];
  const el = document.getElementById('equipe-list');
  el.innerHTML = list.map((m, i) => `
    <div class="list-item">
      <div class="list-item-head"><h4>👤 ${esc(m.nom||'Sans nom')}</h4><button class="btn-del" onclick="removeMembre(${i})">🗑️</button></div>
      <div class="grid2">
        <div class="field"><label>Nom complet</label><input type="text" value="${esc(m.nom||'')}" onchange="contenu.equipe_pastorale.membres[${i}].nom=this.value" /></div>
        <div class="field"><label>Initiales</label><input type="text" value="${esc(m.initiales||'')}" onchange="contenu.equipe_pastorale.membres[${i}].initiales=this.value" /></div>
        <div class="field"><label>Rôle <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(m.role||'')}" onchange="contenu.equipe_pastorale.membres[${i}].role=this.value" /></div>
        <div class="field"><label>Rôle <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(m.role_nl||'')}" onchange="contenu.equipe_pastorale.membres[${i}].role_nl=this.value" /></div>
        <div class="field"><label>Rôle <span class="lang lang-en">EN</span></label><input type="text" value="${esc(m.role_en||'')}" onchange="contenu.equipe_pastorale.membres[${i}].role_en=this.value" /></div>
      </div>
    </div>`).join('');
}
function addMembre() {
  if (!contenu.equipe_pastorale) contenu.equipe_pastorale = { membres: [] };
  contenu.equipe_pastorale.membres.push({ nom:'', initiales:'', role:'', role_nl:'', role_en:'' });
  renderEquipe();
}
function removeMembre(i) {
  if (!confirm('Supprimer ce membre ?')) return;
  contenu.equipe_pastorale.membres.splice(i, 1); renderEquipe();
}

// ════════════ TÉMOIGNAGES ════════════

function renderTemoignages() {
  const list = contenu.temoignages?.liste || [];
  const el = document.getElementById('temoignages-list');
  el.innerHTML = list.map((t, i) => `
    <div class="list-item">
      <div class="list-item-head"><h4>💬 ${esc(t.prenom||'Sans nom')}</h4><button class="btn-del" onclick="removeTemoignage(${i})">🗑️</button></div>
      <div class="grid2">
        <div class="field"><label>Prénom</label><input type="text" value="${esc(t.prenom||'')}" onchange="contenu.temoignages.liste[${i}].prenom=this.value" /></div>
        <div class="field"><label>Initiales</label><input type="text" value="${esc(t.initiales||'')}" onchange="contenu.temoignages.liste[${i}].initiales=this.value" /></div>
        <div class="field"><label>Rôle</label><input type="text" value="${esc(t.role||'')}" placeholder="Membre depuis 2 ans" onchange="contenu.temoignages.liste[${i}].role=this.value" /></div>
      </div>
      <div class="field"><label>Témoignage <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.temoignages.liste[${i}].texte=this.value">${esc(t.texte||'')}</textarea></div>
      <div class="field"><label>Témoignage <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.temoignages.liste[${i}].texte_nl=this.value">${esc(t.texte_nl||'')}</textarea></div>
      <div class="field"><label>Témoignage <span class="lang lang-en">EN</span></label><textarea onchange="contenu.temoignages.liste[${i}].texte_en=this.value">${esc(t.texte_en||'')}</textarea></div>
    </div>`).join('');
}
function addTemoignage() {
  if (!contenu.temoignages) contenu.temoignages = { actif:false, liste:[] };
  contenu.temoignages.liste.push({ prenom:'', initiales:'', role:'', texte:'', texte_nl:'', texte_en:'' });
  renderTemoignages();
}
function removeTemoignage(i) {
  if (!confirm('Supprimer ce témoignage ?')) return;
  contenu.temoignages.liste.splice(i, 1); renderTemoignages();
}

// ════════════ PHOTOS CULTE ════════════

function renderPhotosGrid() {
  const el = document.getElementById('photos-grid');
  if (!el) return;
  const photos = photosData.photos || [];
  const count = document.getElementById('photos-count');
  if (count) count.textContent = photos.length + ' photo(s)';

  if (!photos.length) {
    el.innerHTML = '<p style="color:var(--text2);font-size:14px">Aucune photo. Utilisez le bouton ci-dessus pour en ajouter.</p>';
    return;
  }
  el.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">' +
    photos.map((p, i) => `
      <div style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:4/3;background:var(--bg3)">
        <img src="${esc(p.url)}" loading="lazy"
             style="width:100%;height:100%;object-fit:cover;display:block" />
        <button onclick="deletePhoto(${i})" title="Supprimer"
          style="position:absolute;top:5px;right:5px;width:28px;height:28px;border-radius:50%;
                 background:rgba(0,0,0,0.75);border:none;color:#fca5a5;font-size:16px;
                 cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:rgba(0,0,0,0.7)">
          <input type="text" value="${esc(p.legende||'')}" placeholder="Légende…"
            style="width:100%;background:transparent;border:none;color:#fff;font-size:11px;outline:none"
            onchange="photosData.photos[${i}].legende=this.value" />
        </div>
      </div>`).join('') + '</div>';
}

async function handlePhotoUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  if (!getGHToken()) { toast('Token GitHub requis. Configurez-le dans ⚙ Paramètres.', 'error'); return; }

  const prog = document.getElementById('upload-progress');
  prog.style.display = 'block';
  let done = 0;

  for (const file of files) {
    prog.textContent = `Envoi ${done + 1}/${files.length} : ${file.name}…`;
    try {
      const base64  = await fileToBase64(file);
      const safeName = file.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.\-_]/g, '');
      const path    = `img/uploads/${Date.now()}-${safeName}`;
      await ghCommitBinary(path, base64, `Ajout photo: ${safeName}`);
      photosData.photos.push({ url: `/${path}`, legende: '', date: new Date().toISOString().split('T')[0] });
      done++;
    } catch (e) { toast(`Erreur sur ${file.name} : ${e.message}`, 'error'); }
  }

  if (done > 0) {
    prog.textContent = 'Mise à jour de la liste…';
    try {
      await ghCommitText('photos_culte.json', JSON.stringify(photosData, null, 2), `Ajout ${done} photo(s) via admin`);
      toast(`✓ ${done} photo(s) ajoutée(s) et publiée(s) !`, 'success');
      renderPhotosGrid();
    } catch (e) { toast('Erreur sauvegarde : ' + e.message, 'error'); }
  }
  prog.style.display = 'none';
  input.value = '';
}

async function savePhotosLegends() {
  if (!getGHToken()) { toast('Token GitHub requis. Configurez-le dans ⚙ Paramètres.', 'error'); return; }
  try {
    await ghCommitText('photos_culte.json', JSON.stringify(photosData, null, 2), 'Mise à jour légendes photos via admin');
    toast('✓ Légendes sauvegardées !', 'success');
  } catch (e) { toast('Erreur : ' + e.message, 'error'); }
}

async function deletePhoto(idx) {
  if (!confirm('Supprimer cette photo de la galerie ?')) return;
  photosData.photos.splice(idx, 1);
  if (getGHToken()) {
    try {
      await ghCommitText('photos_culte.json', JSON.stringify(photosData, null, 2), 'Suppression photo via admin');
      toast('Photo supprimée.', 'success');
    } catch (e) { toast('Erreur : ' + e.message, 'error'); }
  }
  renderPhotosGrid();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ════════════ USERS ════════════

function showCurrentUser(user) {
  const el = document.getElementById('current-user-info');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:8px">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px">
        ${(user.email||'A')[0].toUpperCase()}
      </div>
      <div>
        <div style="font-weight:600">${esc(user.email||'')}</div>
        <div style="font-size:12px;color:var(--text2)">Administrateur connecté</div>
      </div>
    </div>`;
}

async function adminFetch(method, body) {
  const user = window.netlifyIdentity?.currentUser();
  if (!user) throw new Error('non connecté');
  const token = await user.jwt();
  const opts = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/.netlify/functions/identity-admin', opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

async function loadUsers() {
  const el = document.getElementById('users-list');
  if (!el) return;
  const me = window.netlifyIdentity?.currentUser();
  try {
    const data = await adminFetch('GET');
    const users = data.users || [];
    el.innerHTML = users.map(u => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg3);border-radius:8px;margin-bottom:8px">
        <div>
          <div style="font-size:14px;font-weight:500">${esc(u.email)}</div>
          <div style="font-size:11px;color:var(--text2)">${u.email === SUPER_ADMIN ? '👑 Super-admin' : (u.confirmed_at ? 'Compte actif' : 'Invitation en attente')}</div>
        </div>
        ${u.email !== SUPER_ADMIN ? `<button class="btn-del" onclick="deleteUser('${u.id}','${esc(u.email)}')">Supprimer</button>` : '<span style="font-size:11px;color:var(--text2)">Vous</span>'}
      </div>`).join('') || '<p style="color:var(--text2);font-size:13px">Aucun utilisateur.</p>';
  } catch (e) {
    el.innerHTML = `<p style="font-size:13px;color:var(--text2)">${esc(e.message)}</p>`;
  }
}

async function inviteUser() {
  const email = document.getElementById('invite-email').value.trim();
  const resultEl = document.getElementById('invite-result');
  if (!email || !email.includes('@')) {
    showResult(resultEl, 'error', 'Entrez une adresse email valide.'); return;
  }
  try {
    const result = await adminFetch('POST', { email });
    const msg = result.resent
      ? `✓ Invitation renvoyée à ${email}. Vérifiez vos spams.`
      : `✓ Invitation envoyée à ${email}.`;
    showResult(resultEl, 'success', msg);
    document.getElementById('invite-email').value = '';
    loadUsers();
  } catch (e) {
    showResult(resultEl, 'warn', e.message);
  }
}

function showResult(el, type, msg) {
  const styles = {
    success: ['rgba(16,185,129,.1)', 'rgba(16,185,129,.2)', '#6ee7b7'],
    error:   ['rgba(239,68,68,.1)',  'rgba(239,68,68,.2)',  '#fca5a5'],
    warn:    ['rgba(245,158,11,.1)', 'rgba(245,158,11,.2)', '#fcd34d'],
  };
  const [bg, border, color] = styles[type] || styles.error;
  el.style.display = 'block';
  el.style.background = bg;
  el.style.border = `1px solid ${border}`;
  el.style.color = color;
  el.textContent = msg;
}

async function deleteUser(userId, email) {
  if (!confirm(`Supprimer l'accès de ${email} ?`)) return;
  try {
    await adminFetch('DELETE', { userId });
    toast(`Accès supprimé pour ${email}`, 'success');
    loadUsers();
  } catch (e) { toast(e.message, 'error'); }
}

// ════════════ HELPERS ════════════

function bindField(el) {
  const val = getPath(contenu, el.dataset.path);
  if (el.type === 'checkbox') el.checked = !!val; else el.value = val || '';
  el.addEventListener('input',  () => setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value));
  el.addEventListener('change', () => setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value));
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 5000);
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
}

function downloadJSON() {
  const json = JSON.stringify(contenu, null, 2);
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([json], {type:'application/json'})),
    download: 'contenu.json'
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
