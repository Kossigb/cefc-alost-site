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
}

// ════════════ GITHUB API (via proxy Netlify) ════════════

// Écriture dans le dépôt GitHub.
// 1) via la fonction github-proxy (nécessite GITHUB_TOKEN dans les variables Netlify) ;
// 2) sinon via Git Gateway de Netlify Identity, qui n'a besoin d'aucun jeton GitHub.
let useGitGateway = false;
async function ghProxy(method, path, data) {
  const user = window.netlifyIdentity && window.netlifyIdentity.currentUser();
  const jwt  = user ? await user.jwt() : null;
  const auth = jwt ? { Authorization: `Bearer ${jwt}` } : {};

  if (!useGitGateway) {
    const res = await fetch('/.netlify/functions/github-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ method, path, data }),
    });
    if (res.status !== 500 || !(await res.clone().text()).includes('GITHUB_TOKEN')) return res;
    useGitGateway = true; // jeton absent : on bascule pour le reste de la session
  }

  const rel = path.replace(/^\/?repos\/[^/]+\/[^/]+\//, '');
  return fetch(`/.netlify/git/github/${rel}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...auth },
    body: data ? JSON.stringify(data) : undefined,
  });
}

async function ghError(res) {
  let msg = `Erreur ${res.status}`;
  try { const e = await res.json(); msg = e.message || e.msg || e.error || msg; } catch {}
  return new Error(msg);
}

async function ghGetSHA(path) {
  try {
    const res = await ghProxy('GET', `repos/${REPO}/contents/${path}?ref=${BRANCH}`);
    if (!res.ok) return null;
    return (await res.json()).sha;
  } catch { return null; }
}

async function ghCommitText(path, content, message) {
  const sha  = await ghGetSHA(path);
  const body = { message, branch: BRANCH, content: btoa(unescape(encodeURIComponent(content))) };
  if (sha) body.sha = sha;
  const res = await ghProxy('PUT', `repos/${REPO}/contents/${path}`, body);
  if (!res.ok) throw await ghError(res);
}

async function ghCommitBinary(path, base64, message) {
  const sha  = await ghGetSHA(path);
  const body = { message, branch: BRANCH, content: base64 };
  if (sha) body.sha = sha;
  const res = await ghProxy('PUT', `repos/${REPO}/contents/${path}`, body);
  if (!res.ok) throw await ghError(res);
}

// ════════════ SAVE ALL → GITHUB ════════════

async function saveAll() {
  (contenu.departements?.liste || []).forEach(d => delete d._nouveau);
  document.querySelectorAll('[data-path]').forEach(el => {
    setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value);
  });
  const btns = document.querySelectorAll('.save-btn');
  btns.forEach(b => { b._orig = b.textContent; b.textContent = '⏳ Publication…'; b.disabled = true; });
  try {
    await ghCommitText('contenu.json', JSON.stringify(contenu, null, 2), 'Mise à jour contenu via admin CEFC');
    toast('✓ Modifications publiées ! Le site se met à jour automatiquement.', 'success');
  } catch (e) {
    toast('Erreur GitHub : ' + e.message, 'error');
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
  renderJefcAnnonces();
  renderHoraires();
  renderNavette();
  renderDepts();
  renderEquipe();
  renderTemoignages();
}

// ════════════ ANNONCES DE LA JEUNESSE ════════════

function renderJefcAnnonces() {
  const el = document.getElementById('jefc-annonces-list');
  if (!el) return;
  const list = annList('jefc');
  if (!list.length) { el.innerHTML = '<p class="field-hint" style="margin-bottom:12px">Aucune annonce pour la jeunesse : la section est cachée sur le site.</p>'; return; }
  const P = `contenu.jefc.annonces`;
  const f = (i, k, label, ta, ph = '') => {
    const v = esc(list[i][k] || ''), on = `oninput="${P}[${i}]['${k}']=this.value"`;
    return ta ? `<div class="field"><label>${label}</label><textarea ${on} placeholder="${ph}" rows="4">${v}</textarea></div>`
              : `<div class="field"><label>${label}</label><input type="text" value="${v}" ${on} placeholder="${ph}" /></div>`;
  };
  el.innerHTML = list.map((a, i) => `
    <div class="list-item ann-item${a.masquer ? ' is-hidden' : ''}">
      <div class="list-item-head">
        <h4>${esc(a.titre || 'Annonce sans titre')} ${a.masquer ? '<span class="pill pill-off">Masquée</span>' : '<span class="pill pill-on">Affichée</span>'}</h4>
        <div class="row-actions">
          <button class="btn-mini" onclick="moveJefcAnnonce(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-mini" onclick="moveJefcAnnonce(${i},1)" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-del" onclick="removeJefcAnnonce(${i})">Supprimer</button>
        </div>
      </div>
      <div class="ann-toggles">
        <label class="ann-switch"><span class="toggle"><input type="checkbox" ${a.masquer ? '' : 'checked'} onchange="${P}[${i}].masquer=!this.checked; renderJefcAnnonces()" /><span class="toggle-slider"></span></span> Afficher sur le site</label>
        <label class="ann-switch"><span class="toggle"><input type="checkbox" ${a.important ? 'checked' : ''} onchange="${P}[${i}].important=this.checked; renderJefcAnnonces()" /><span class="toggle-slider"></span></span> À la une</label>
      </div>
      <div class="grid2" style="margin-top:4px">${f(i, 'titre', "Titre de l'annonce " + L('fr'), false, 'ex : Brunch de rentrée')}${f(i, 'date', 'Date', false, 'ex : Samedi 3 octobre 2026 à 12h')}</div>
      ${f(i, 'description', "Texte de l'annonce " + L('fr'), true, 'ex : Le comeback de la jeunesse ! Viens avec un plat à partager, et ne viens pas seul.')}
      <div class="dept-photo-row" style="margin:6px 0 14px">
        <div class="dept-photo" style="${a.image ? `background-image:url('${esc(a.image)}')` : ''}">${a.image ? '' : '<span>Pas de photo</span>'}</div>
        <div class="dept-photo-actions">
          <button class="btn-upload" onclick="openPhotoPicker(${i}, 'jefc')">Choisir une photo</button>
          <label class="btn-mini" style="cursor:pointer">Envoyer une nouvelle photo
            <input type="file" accept="image/*" hidden onchange="uploadAnnoncePhoto(${i}, this, 'jefc')" /></label>
          ${a.image ? `<button class="btn-mini" onclick="${P}[${i}].image=''; renderJefcAnnonces()">Retirer la photo</button>` : ''}
          <div class="field-hint" id="jefc-ann-upload-${i}"></div>
        </div>
      </div>
      <details class="dept-more"><summary>Traductions NL / EN</summary>
        <div class="grid2">${f(i, 'titre_nl', 'Titre ' + L('nl'))}${f(i, 'titre_en', 'Titre ' + L('en'))}</div>
        ${f(i, 'description_nl', 'Texte ' + L('nl'), true)}${f(i, 'description_en', 'Texte ' + L('en'), true)}
      </details>
    </div>`).join('');
}
function addJefcAnnonce() {
  annList('jefc').unshift({ titre: '', date: '', description: '', image: '', important: false, masquer: false });
  renderJefcAnnonces();
}
function moveJefcAnnonce(i, dir) {
  const l = annList('jefc'), j = i + dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  renderJefcAnnonces();
}
function removeJefcAnnonce(i) {
  if (!confirm('Supprimer cette annonce de la jeunesse ?')) return;
  annList('jefc').splice(i, 1); renderJefcAnnonces();
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

// Deux listes d'annonces : celles de l'église et celles de la jeunesse (page JEFC)
function annList(kind) {
  if (kind === 'jefc') {
    if (!contenu.jefc) contenu.jefc = {};
    if (!Array.isArray(contenu.jefc.annonces)) contenu.jefc.annonces = [];
    return contenu.jefc.annonces;
  }
  if (!contenu.annonces) contenu.annonces = { liste: [] };
  return contenu.annonces.liste;
}
function rerenderAnn(kind) { kind === 'jefc' ? renderJefcAnnonces() : renderAnnonces(); }

const ANN_TYPES = [['annonce', 'Annonce'], ['activite', 'Activité / événement'], ['necro', 'Nécrologie']];

function annField(i, key, label, type = 'text', ph = '') {
  const v = esc(contenu.annonces.liste[i][key] || '');
  const on = `onchange="contenu.annonces.liste[${i}]['${key}']=this.value"`;
  return type === 'textarea'
    ? `<div class="field"><label>${label}</label><textarea ${on}>${v}</textarea></div>`
    : `<div class="field"><label>${label}</label><input type="text" value="${v}" placeholder="${ph}" ${on} /></div>`;
}

function renderAnnonces() {
  const list = contenu.annonces?.liste || [];
  const el = document.getElementById('annonces-list');
  if (!list.length) { el.innerHTML = '<p style="color:var(--text2);font-size:14px;margin-bottom:16px">Aucune annonce.</p>'; return; }
  const shown = list.filter(a => !a.masquer).length;
  el.innerHTML = `<p class="field-hint" style="margin-bottom:12px">${shown} annonce(s) affichée(s) sur le site, ${list.length - shown} masquée(s).</p>` +
  list.map((a, i) => {
    const type = a.type || 'annonce';
    return `
    <div class="list-item ann-item${a.masquer ? ' is-hidden' : ''}">
      <div class="list-item-head">
        <h4>${esc(a.titre || 'Sans titre')} ${a.masquer ? '<span class="pill pill-off">Masquée</span>' : '<span class="pill pill-on">Affichée</span>'}${a.important ? ' <span class="pill">À la une</span>' : ''}</h4>
        <div class="row-actions">
          <button class="btn-mini" title="Monter" onclick="moveAnnonce(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-mini" title="Descendre" onclick="moveAnnonce(${i},1)" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-del" onclick="removeAnnonce(${i})">Supprimer</button>
        </div>
      </div>

      <div class="ann-toggles">
        <label class="ann-switch">
          <span class="toggle"><input type="checkbox" ${a.masquer ? '' : 'checked'} onchange="contenu.annonces.liste[${i}].masquer=!this.checked; renderAnnonces()" /><span class="toggle-slider"></span></span>
          Afficher sur le site
        </label>
        <label class="ann-switch">
          <span class="toggle"><input type="checkbox" ${a.important ? 'checked' : ''} onchange="contenu.annonces.liste[${i}].important=this.checked; renderAnnonces()" /><span class="toggle-slider"></span></span>
          À la une (en premier)
        </label>
        <div class="field" style="margin:0;min-width:200px">
          <select onchange="contenu.annonces.liste[${i}].type=this.value; renderAnnonces()">
            ${ANN_TYPES.map(([v, t]) => `<option value="${v}" ${type === v ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="dept-photo-row">
        <div class="dept-photo" style="${a.image ? `background-image:url('${esc(a.image)}')` : ''}">${a.image ? '' : '<span>Pas de photo</span>'}</div>
        <div class="dept-photo-actions">
          <button class="btn-upload" onclick="openPhotoPicker(${i})">Choisir une photo</button>
          <label class="btn-mini" style="cursor:pointer">Envoyer une nouvelle photo
            <input type="file" accept="image/*" hidden onchange="uploadAnnoncePhoto(${i}, this)" /></label>
          ${a.image ? `<button class="btn-mini" onclick="contenu.annonces.liste[${i}].image=''; renderAnnonces()">Retirer la photo</button>` : ''}
          <div class="field-hint" id="ann-upload-${i}">Choisissez parmi les photos du culte déjà en ligne, ou envoyez-en une nouvelle.</div>
        </div>
      </div>

      <div class="grid3" style="margin-top:14px">
        ${annField(i, 'titre', 'Titre ' + L('fr'))}
        ${annField(i, 'titre_nl', 'Titre ' + L('nl'))}
        ${annField(i, 'titre_en', 'Titre ' + L('en'))}
      </div>
      <div class="grid3">
        ${annField(i, 'date', 'Date de publication', 'text', 'ex : Annoncé le 28 juillet 2026')}
        ${type === 'activite' ? annField(i, 'dateEvenement', "Date de l'événement", 'text', 'ex : Samedi 9 août 2026') : ''}
        ${type === 'activite' ? annField(i, 'heureEvenement', 'Heure', 'text', 'ex : 19h00') : ''}
      </div>
      ${type === 'activite' ? annField(i, 'lieuEvenement', 'Lieu', 'text', 'Wijngaardveld 29, 9300 Alost') : ''}
      ${annField(i, 'description', 'Texte ' + L('fr'), 'textarea')}
      <details class="dept-more">
        <summary>Traductions NL / EN</summary>
        ${annField(i, 'description_nl', 'Texte ' + L('nl'), 'textarea')}
        ${annField(i, 'description_en', 'Texte ' + L('en'), 'textarea')}
        <div class="grid2">
          ${annField(i, 'date_nl', 'Date ' + L('nl'))}
          ${annField(i, 'date_en', 'Date ' + L('en'))}
        </div>
      </details>
    </div>`;
  }).join('');
}
function addAnnonce() {
  if (!contenu.annonces) contenu.annonces = { liste: [] };
  contenu.annonces.liste.unshift({ type: 'annonce', titre: 'Nouvelle annonce', date: '', description: '', description_nl: '', description_en: '', image: '', important: false, masquer: false });
  renderAnnonces();
}
function moveAnnonce(i, dir) {
  const l = contenu.annonces.liste, j = i + dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  renderAnnonces();
}
function removeAnnonce(i) {
  if (!confirm('Supprimer définitivement cette annonce ? Pour la cacher seulement, décochez « Afficher sur le site ».')) return;
  contenu.annonces.liste.splice(i, 1); renderAnnonces();
}

async function uploadAnnoncePhoto(i, input, kind = 'annonces') {
  const file = input.files && input.files[0];
  if (!file) return;
  const hint = document.getElementById((kind === 'jefc' ? 'jefc-ann-upload-' : 'ann-upload-') + i);
  if (hint) hint.textContent = 'Envoi de la photo…';
  try {
    const { base64, ext } = await compressImage(file);
    const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const path = `img/uploads/${Date.now()}-${base || 'annonce'}.${ext}`;
    await ghCommitBinary(path, base64, 'Photo d\'annonce');
    annList(kind)[i].image = '/' + path;
    rerenderAnn(kind);
    await saveAll();
  } catch (e) {
    if (hint) hint.textContent = 'Échec : ' + e.message;
    toast('Erreur photo : ' + e.message, 'error');
  }
  input.value = '';
}

// Choix d'une photo parmi celles déjà en ligne (galerie du culte + photos d'annonces)
function openPhotoPicker(i, kind = 'annonces') {
  const seen = new Set();
  const photos = [
    ...(contenu.annonces?.liste || []).map(a => a.image),
    ...(contenu.jefc?.annonces || []).map(a => a.image),
    ...(photosData.photos || []).map(p => p.url),
  ].filter(u => u && !seen.has(u) && seen.add(u));
  const current = annList(kind)[i].image;
  const ov = document.createElement('div');
  ov.className = 'picker-overlay';
  ov.innerHTML = `
    <div class="picker" role="dialog" aria-label="Choisir une photo">
      <div class="picker-head"><strong>Choisir une photo</strong><span class="muted">${photos.length} photo(s)</span>
        <button class="btn-mini" data-close>Fermer</button></div>
      <div class="picker-grid">${photos.length ? photos.map(u => `
        <button class="picker-item${u === current ? ' selected' : ''}" data-url="${esc(u)}" style="background-image:url('${esc(u)}')"></button>`).join('')
        : '<p class="muted">Aucune photo en ligne pour le moment. Utilisez « Envoyer une nouvelle photo ».</p>'}</div>
    </div>`;
  const close = () => ov.remove();
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('[data-close]')) return close();
    const item = e.target.closest('.picker-item');
    if (!item) return;
    annList(kind)[i].image = item.dataset.url;
    close(); rerenderAnn(kind);
    toast('Photo choisie. Cliquez sur « Enregistrer » pour publier.', 'success');
  });
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } });
  document.body.appendChild(ov);
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

// Même règle que sur le site : "chorale.jpg" → /img/dept/chorale.jpg, "-" = pas de photo
function deptPhotoUrl(photo) {
  if (!photo || photo === '-') return '';
  return /^(https?:)?\//.test(photo) ? photo : '/img/dept/' + photo;
}

function deptField(i, key, label, type = 'text') {
  const d = contenu.departements.liste[i];
  const v = esc(d[key] || '');
  const on = `onchange="contenu.departements.liste[${i}]['${key}']=this.value"`;
  return type === 'textarea'
    ? `<div class="field"><label>${label}</label><textarea ${on}>${v}</textarea></div>`
    : `<div class="field"><label>${label}</label><input type="text" value="${v}" ${on} /></div>`;
}
const L = (code) => `<span class="lang lang-${code}">${code.toUpperCase()}</span>`;

function renderDepts() {
  const list = contenu.departements?.liste || [];
  const el = document.getElementById('dept-list');
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = list.map((d, i) => {
    const url = deptPhotoUrl(d.photo);
    return `
    <div class="list-item dept-item${d.masquer ? ' is-hidden' : ''}">
      <div class="list-item-head">
        <h4>${esc(d.nom || 'Sans nom')}${d.masquer ? ' <small class="muted">(masqué)</small>' : ''}</h4>
        <div class="row-actions">
          <button class="btn-mini" title="Monter" onclick="moveDept(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-mini" title="Descendre" onclick="moveDept(${i},1)" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-del" onclick="removeDept(${i})">Supprimer</button>
        </div>
      </div>

      <div class="dept-photo-row">
        <div class="dept-photo" style="${url ? `background-image:url('${esc(url)}');background-position:${esc(d.cadrage || 'center')}` : ''}">
          ${url ? '' : '<span>Pas de photo</span>'}
        </div>
        <div class="dept-photo-actions">
          <label class="btn-upload">
            Changer la photo
            <input type="file" accept="image/*" hidden onchange="uploadDeptPhoto(${i}, this)" />
          </label>
          ${url ? `<button class="btn-mini" onclick="clearDeptPhoto(${i})">Retirer la photo</button>` : ''}
          <div class="field" style="margin:10px 0 0">
            <label>Cadrage de la photo</label>
            <select onchange="contenu.departements.liste[${i}].cadrage=this.value; renderDepts()">
              ${[['center', 'Centré'], ['top', 'Haut de la photo'], ['bottom', 'Bas de la photo'], ['left', 'Gauche'], ['right', 'Droite']]
                .map(([v, t]) => `<option value="${v}" ${(d.cadrage || 'center') === v ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="field-hint" id="dept-upload-${i}">JPG, PNG ou photo de téléphone. Elle est redimensionnée automatiquement.</div>
        </div>
      </div>

      <div class="toggle-row" style="margin:14px 0">
        <label>Masquer ce département sur le site</label>
        <label class="toggle"><input type="checkbox" ${d.masquer ? 'checked' : ''} onchange="contenu.departements.liste[${i}].masquer=this.checked; renderDepts()" /><span class="toggle-slider"></span></label>
      </div>

      <div class="grid3">
        ${deptField(i, 'nom', 'Nom ' + L('fr'))}
        ${deptField(i, 'nom_nl', 'Nom ' + L('nl'))}
        ${deptField(i, 'nom_en', 'Nom ' + L('en'))}
      </div>
      <div class="field-hint" style="margin:-4px 0 10px">Texte court affiché sur la carte :</div>
      ${deptField(i, 'description', 'Texte de la carte ' + L('fr'), 'textarea')}
      ${deptField(i, 'description_nl', 'Texte de la carte ' + L('nl'), 'textarea')}
      ${deptField(i, 'description_en', 'Texte de la carte ' + L('en'), 'textarea')}

      <details class="dept-more">
        <summary>Fenêtre « Rejoindre » et options</summary>
        ${deptField(i, 'texte_fenetre', 'Texte de présentation dans la fenêtre ' + L('fr'), 'textarea')}
        ${deptField(i, 'texte_fenetre_nl', 'Texte de présentation dans la fenêtre ' + L('nl'), 'textarea')}
        ${deptField(i, 'texte_fenetre_en', 'Texte de présentation dans la fenêtre ' + L('en'), 'textarea')}
        <div class="field">
          <label>Choix proposés dans le formulaire (un par ligne)</label>
          <textarea onchange="contenu.departements.liste[${i}].options=this.value.split('\n').map(x=>x.trim()).filter(Boolean)">${esc((d.options || []).join('\n'))}</textarea>
          <div class="field-hint">Laisser vide pour garder les choix actuels du site.</div>
        </div>
        <div class="field">
          <label>Identifiant technique</label>
          <input type="text" value="${esc(d.id || '')}" ${d._nouveau ? `onchange="contenu.departements.liste[${i}].id=this.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-')"` : 'readonly'} />
          <div class="field-hint">${d._nouveau ? 'Un mot sans espace ni accent, ex : « evangelisation ».' : 'Ne se modifie pas : il relie ce département à sa carte sur le site.'}</div>
        </div>
      </details>
    </div>`;
  }).join('');
}

async function uploadDeptPhoto(i, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const d = contenu.departements.liste[i];
  const hint = document.getElementById('dept-upload-' + i);
  if (hint) hint.textContent = 'Envoi de la photo…';
  try {
    const { base64, ext } = await compressImage(file);
    const path = `img/dept/${d.id || 'dept'}-${Date.now()}.${ext}`;
    await ghCommitBinary(path, base64, `Photo du département ${d.nom || d.id}`);
    d.photo = '/' + path;
    renderDepts();
    await saveAll();
  } catch (e) {
    if (hint) hint.textContent = 'Échec : ' + e.message;
    toast('Erreur photo : ' + e.message, 'error');
  }
  input.value = '';
}
function clearDeptPhoto(i) {
  if (!confirm('Retirer la photo de ce département ? (le fichier reste sur le serveur)')) return;
  contenu.departements.liste[i].photo = '-';
  renderDepts();
}
function moveDept(i, dir) {
  const l = contenu.departements.liste, j = i + dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  renderDepts();
}
function addDept() {
  if (!contenu.departements) contenu.departements = { liste: [] };
  contenu.departements.liste.push({ id: 'nouveau-' + (contenu.departements.liste.length + 1), _nouveau: true, nom: 'Nouveau département', nom_nl: '', nom_en: '', description: '', description_nl: '', description_en: '', photo: '' });
  renderDepts();
  const items = document.querySelectorAll('.dept-item');
  items[items.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function removeDept(i) {
  if (!confirm('Supprimer ce département ? Pour le cacher temporairement, utilisez plutôt « Masquer ».')) return;
  contenu.departements.liste.splice(i, 1); renderDepts();
}

// ════════════ ÉQUIPE ════════════

function renderEquipe() {
  const list = contenu.equipe_pastorale?.membres || [];
  const el = document.getElementById('equipe-list');
  const set = (i, k) => `onchange="contenu.equipe_pastorale.membres[${i}]['${k}']=this.value"`;
  el.innerHTML = list.map((m, i) => `
    <div class="list-item">
      <div class="list-item-head"><h4>👤 ${esc(m.nom||'Sans nom')}</h4><button class="btn-del" onclick="removeMembre(${i})">Supprimer</button></div>
      <div class="dept-photo-row" style="grid-template-columns:96px 1fr;margin-bottom:12px">
        <div class="dept-photo" style="aspect-ratio:1;border-radius:50%;${m.photo ? `background-image:url('${esc(m.photo)}')` : ''}">${m.photo ? '' : esc(m.initiales || '?')}</div>
        <div class="dept-photo-actions">
          <label class="btn-upload">${m.photo ? 'Changer la photo' : 'Ajouter une photo'}
            <input type="file" accept="image/*" hidden onchange="uploadMembrePhoto(${i}, this)" /></label>
          ${m.photo ? `<button class="btn-mini" onclick="contenu.equipe_pastorale.membres[${i}].photo=''; renderEquipe()">Retirer la photo</button>` : ''}
          <div class="field-hint" id="membre-upload-${i}">Sans photo, les initiales sont affichées.</div>
        </div>
      </div>
      <div class="grid2">
        <div class="field"><label>Nom complet</label><input type="text" value="${esc(m.nom||'')}" ${set(i,'nom')} /></div>
        <div class="field"><label>Initiales</label><input type="text" value="${esc(m.initiales||'')}" ${set(i,'initiales')} /></div>
        <div class="field"><label>Rôle <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(m.role||'')}" ${set(i,'role')} /></div>
        <div class="field"><label>Rôle <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(m.role_nl||'')}" ${set(i,'role_nl')} /></div>
        <div class="field"><label>Rôle <span class="lang lang-en">EN</span></label><input type="text" value="${esc(m.role_en||'')}" ${set(i,'role_en')} /></div>
      </div>
    </div>`).join('');
}
async function uploadMembrePhoto(i, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const m = contenu.equipe_pastorale.membres[i];
  const hint = document.getElementById('membre-upload-' + i);
  if (hint) hint.textContent = 'Envoi de la photo…';
  try {
    const { base64, ext } = await compressImage(file);
    const slug = (m.nom || 'membre').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
    const path = `img/equipe/${slug}-${Date.now()}.${ext}`;
    await ghCommitBinary(path, base64, `Photo de ${m.nom || 'membre'}`);
    m.photo = '/' + path;
    renderEquipe();
    await saveAll();
  } catch (e) {
    if (hint) hint.textContent = 'Échec : ' + e.message;
    toast('Erreur photo : ' + e.message, 'error');
  }
  input.value = '';
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

let photoSelectMode = false;
const photoSelected = new Set();

function renderPhotosGrid() {
  const el = document.getElementById('photos-grid');
  if (!el) return;
  const photos = photosData.photos || [];
  const count = document.getElementById('photos-count');
  if (count) count.textContent = photos.length + ' photo(s)';

  // Render toolbar
  const toolbar = document.getElementById('photos-toolbar');
  if (toolbar) {
    toolbar.style.display = photos.length ? 'flex' : 'none';
    toolbar.innerHTML = photoSelectMode ? `
      <button onclick="toggleSelectAll()" style="padding:7px 14px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:13px;cursor:pointer">
        ☑ Tout sélectionner
      </button>
      <button onclick="deleteSelectedPhotos()" id="btn-del-sel"
        style="padding:7px 14px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:none">
        🗑 Supprimer (<span id="sel-count">0</span>)
      </button>
      <button onclick="exitSelectMode()" style="padding:7px 14px;background:transparent;border:1px solid var(--border);color:var(--text2);border-radius:8px;font-size:13px;cursor:pointer;margin-left:auto">
        Annuler
      </button>
    ` : `
      <button onclick="enterSelectMode()" style="padding:7px 14px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#fca5a5;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
        🗑 Supprimer plusieurs
      </button>
    `;
  }

  if (!photos.length) {
    el.innerHTML = '<p style="color:var(--text2);font-size:14px">Aucune photo. Utilisez le bouton ci-dessus pour en ajouter.</p>';
    return;
  }

  el.innerHTML =
    `<div id="photos-sortable" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">` +
    photos.map((p, i) => `
      <div id="photo-tile-${i}" onclick="${photoSelectMode ? `togglePhotoSelect(${i})` : ''}"
        style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:4/3;background:var(--bg3);
               ${photoSelectMode ? 'cursor:pointer;' : ''}
               ${photoSelected.has(i) ? 'outline:3px solid var(--red);outline-offset:-3px;' : ''}">
        <img src="${esc(p.url)}" loading="lazy"
             style="width:100%;height:100%;object-fit:cover;display:block;${photoSelected.has(i) ? 'opacity:.65' : ''}" />
        ${photoSelectMode ? `
          <div style="position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:6px;
                      background:${photoSelected.has(i) ? '#ef4444' : 'rgba(0,0,0,0.6)'};
                      border:2px solid ${photoSelected.has(i) ? '#ef4444' : 'rgba(255,255,255,0.6)'};
                      display:flex;align-items:center;justify-content:center;font-size:13px">
            ${photoSelected.has(i) ? '✓' : ''}
          </div>` : `
          <button onclick="deletePhoto(${i})" title="Supprimer"
            style="position:absolute;top:5px;right:5px;width:28px;height:28px;border-radius:50%;
                   background:rgba(0,0,0,0.75);border:none;color:#fca5a5;font-size:16px;
                   cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>`}
        <div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:rgba(0,0,0,0.7)">
          <input type="text" value="${esc(p.legende||'')}" placeholder="Légende…"
            style="width:100%;background:transparent;border:none;color:#fff;font-size:11px;outline:none"
            onchange="photosData.photos[${i}].legende=this.value"
            onclick="event.stopPropagation()" />
        </div>
      </div>`).join('') + '</div>';
  requestAnimationFrame(initPhotosDragSort);
}

function initPhotosDragSort() {
  if (photoSelectMode) return;
  const container = document.getElementById('photos-sortable');
  if (!container || !window.Sortable) return;
  new window.Sortable(container, {
    animation: 200,
    ghostClass: 'photo-drag-ghost',
    chosenClass: 'photo-drag-chosen',
    delay: 80,
    delayOnTouchOnly: true,
    onEnd(evt) {
      const moved = photosData.photos.splice(evt.oldIndex, 1)[0];
      photosData.photos.splice(evt.newIndex, 0, moved);
      toast('Ordre modifié — cliquez 💾 pour sauvegarder.', 'success');
    },
  });
}

function openPreview() {
  sessionStorage.setItem('cefc_preview', JSON.stringify(contenu));
  window.open('/?preview=1', '_blank');
}

function enterSelectMode() {
  photoSelectMode = true;
  photoSelected.clear();
  renderPhotosGrid();
}

function exitSelectMode() {
  photoSelectMode = false;
  photoSelected.clear();
  renderPhotosGrid();
}

function togglePhotoSelect(i) {
  if (photoSelected.has(i)) photoSelected.delete(i);
  else photoSelected.add(i);
  // Update tile appearance inline (fast, no full re-render)
  const tile = document.getElementById(`photo-tile-${i}`);
  if (tile) {
    const selected = photoSelected.has(i);
    tile.style.outline = selected ? '3px solid #ef4444' : '';
    tile.style.outlineOffset = selected ? '-3px' : '';
    const img = tile.querySelector('img');
    if (img) img.style.opacity = selected ? '.65' : '';
    const chk = tile.querySelector('div');
    if (chk) {
      chk.style.background = selected ? '#ef4444' : 'rgba(0,0,0,0.6)';
      chk.style.borderColor = selected ? '#ef4444' : 'rgba(255,255,255,0.6)';
      chk.textContent = selected ? '✓' : '';
    }
  }
  // Update counter & delete button visibility
  const countEl = document.getElementById('sel-count');
  if (countEl) countEl.textContent = photoSelected.size;
  const delBtn = document.getElementById('btn-del-sel');
  if (delBtn) delBtn.style.display = photoSelected.size ? '' : 'none';
}

function toggleSelectAll() {
  const total = photosData.photos.length;
  if (photoSelected.size === total) {
    photoSelected.clear();
  } else {
    for (let i = 0; i < total; i++) photoSelected.add(i);
  }
  renderPhotosGrid();
}

async function deleteSelectedPhotos() {
  const indices = Array.from(photoSelected).sort((a, b) => b - a); // desc pour splice correct
  if (!indices.length) return;
  if (!confirm(`Supprimer ${indices.length} photo(s) de la galerie ?`)) return;
  indices.forEach(i => photosData.photos.splice(i, 1));
  photoSelected.clear();
  photoSelectMode = false;
  try {
    await ghCommitText('photos_culte.json', JSON.stringify(photosData, null, 2), `Suppression ${indices.length} photo(s) via admin`);
    toast(`✓ ${indices.length} photo(s) supprimée(s).`, 'success');
  } catch (e) { toast('Erreur : ' + e.message, 'error'); }
  renderPhotosGrid();
}

async function handlePhotoUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  const prog = document.getElementById('upload-progress');
  prog.style.display = 'block';
  let done = 0;

  for (const file of files) {
    prog.textContent = `Envoi ${done + 1}/${files.length} : ${file.name}…`;
    try {
      const { base64, ext } = await compressImage(file);
      const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
      const path = `img/uploads/${Date.now()}-${baseName}.${ext}`;
      await ghCommitBinary(path, base64, `Ajout photo: ${baseName}`);
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
  try {
    await ghCommitText('photos_culte.json', JSON.stringify(photosData, null, 2), 'Mise à jour légendes photos via admin');
    toast('✓ Légendes sauvegardées !', 'success');
  } catch (e) { toast('Erreur : ' + e.message, 'error'); }
}

async function deletePhoto(idx) {
  if (!confirm('Supprimer cette photo de la galerie ?')) return;
  photosData.photos.splice(idx, 1);
  try {
    await ghCommitText('photos_culte.json', JSON.stringify(photosData, null, 2), 'Suppression photo via admin');
    toast('Photo supprimée.', 'success');
  } catch (e) { toast('Erreur : ' + e.message, 'error'); }
  renderPhotosGrid();
}

async function compressImage(file) {
  const MAX_W = 1920, QUALITY = 0.82;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_W) { height = Math.round(height * MAX_W / width); width = MAX_W; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression échouée')); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result.split(',')[1], ext: 'webp' });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/webp', QUALITY);
    };
    img.onerror = reject;
    img.src = url;
  });
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
