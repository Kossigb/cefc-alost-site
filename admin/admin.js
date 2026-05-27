// ════════════════════════════════════════
//  CEFC Alost — Admin Dashboard
// ════════════════════════════════════════

// ── IDENTIFIANTS PAR DÉFAUT ──
// Pour changer : connecte-toi > Paramètres > Changer le mot de passe
// Les identifiants sont stockés dans le navigateur (localStorage)
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'cefc2026';

let contenu = {};

// ════════════ AUTH ════════════

function getCredentials() {
  return {
    user: localStorage.getItem('cefc_admin_user') || DEFAULT_USER,
    pass: localStorage.getItem('cefc_admin_pass') || DEFAULT_PASS
  };
}

function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const creds = getCredentials();
  if (user === creds.user && pass === creds.pass) {
    sessionStorage.setItem('cefc_auth', '1');
    sessionStorage.setItem('cefc_user', user);
    showApp();
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-pass').value = '';
  }
}

function doLogout() {
  sessionStorage.removeItem('cefc_auth');
  sessionStorage.removeItem('cefc_user');
  location.reload();
}

function changePassword() {
  const user = document.getElementById('new-username').value.trim();
  const pass = document.getElementById('new-pass').value;
  const conf = document.getElementById('confirm-pass').value;
  if (!user || !pass) return toast('Identifiant et mot de passe requis.', 'error');
  if (pass !== conf) return toast('Les mots de passe ne correspondent pas.', 'error');
  localStorage.setItem('cefc_admin_user', user);
  localStorage.setItem('cefc_admin_pass', pass);
  toast('Identifiants mis à jour ! Reconnectez-vous lors de votre prochaine session.', 'success');
  document.getElementById('new-username').value = '';
  document.getElementById('new-pass').value = '';
  document.getElementById('confirm-pass').value = '';
}

// Allow Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('login-user').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-pass').focus();
  });

  if (sessionStorage.getItem('cefc_auth') === '1') {
    showApp();
  }
});

async function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.add('open');
  const u = sessionStorage.getItem('cefc_user') || 'Administrateur';
  document.getElementById('admin-username').textContent = u;
  setupNav();
  await loadContent();
  populateAll();
}

// ════════════ NAVIGATION ════════════

function setupNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('page-' + item.dataset.page).classList.add('active');
      // close mobile menu
      document.getElementById('sidebar').classList.remove('mobile-open');
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
  } catch (e) {
    toast('Impossible de charger contenu.json', 'error');
    contenu = {};
  }
}

// ════════════ POPULATE FIELDS ════════════

// Set a value deep in an object using dot-path notation
function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
}

function populateAll() {
  // Fill all simple data-path fields
  document.querySelectorAll('[data-path]').forEach(el => {
    const val = getPath(contenu, el.dataset.path);
    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else {
      el.value = val || '';
    }
    // Listen for changes
    el.addEventListener('input', () => {
      const v = el.type === 'checkbox' ? el.checked : el.value;
      setPath(contenu, el.dataset.path, v);
    });
    el.addEventListener('change', () => {
      const v = el.type === 'checkbox' ? el.checked : el.value;
      setPath(contenu, el.dataset.path, v);
    });
  });

  // Render dynamic lists
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
    const base = `horaires.${d.key}`;
    return `
    <div class="card">
      <div class="card-title">${d.icon} ${d.label}</div>
      <div class="field"><label>Heure</label><input type="text" data-path="${base}.heure" value="${getPath(contenu,base+'.heure')}" /></div>
      <div class="grid3">
        <div class="field"><label>Nom <span class="lang lang-fr">FR</span></label><input type="text" data-path="${base}.nom" value="${esc(getPath(contenu,base+'.nom'))}" /></div>
        <div class="field"><label>Nom <span class="lang lang-nl">NL</span></label><input type="text" data-path="${base}.nom_nl" value="${esc(getPath(contenu,base+'.nom_nl'))}" /></div>
        <div class="field"><label>Nom <span class="lang lang-en">EN</span></label><input type="text" data-path="${base}.nom_en" value="${esc(getPath(contenu,base+'.nom_en'))}" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea data-path="${base}.description">${esc(getPath(contenu,base+'.description'))}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea data-path="${base}.description_nl">${esc(getPath(contenu,base+'.description_nl'))}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea data-path="${base}.description_en">${esc(getPath(contenu,base+'.description_en'))}</textarea></div>
    </div>`;
  }).join('');
  // bind new inputs
  el.querySelectorAll('[data-path]').forEach(bindField);
}

// ════════════ ANNONCES ════════════

function renderAnnonces() {
  const list = contenu.annonces?.liste || [];
  const el = document.getElementById('annonces-list');
  if (list.length === 0) {
    el.innerHTML = '<p style="color:var(--text2);margin-bottom:16px;font-size:14px">Aucune annonce pour le moment.</p>';
    return;
  }
  el.innerHTML = list.map((a, i) => `
    <div class="list-item" id="annonce-${i}">
      <div class="list-item-head">
        <h4>📌 ${esc(a.titre || 'Sans titre')}</h4>
        <button class="btn-del" onclick="removeAnnonce(${i})">🗑️ Supprimer</button>
      </div>
      <div class="grid2">
        <div class="field"><label>Titre <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(a.titre||'')}" onchange="contenu.annonces.liste[${i}].titre=this.value" /></div>
        <div class="field"><label>Date</label><input type="text" value="${esc(a.date||'')}" placeholder="ex: 15 juin 2026" onchange="contenu.annonces.liste[${i}].date=this.value" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.annonces.liste[${i}].description=this.value">${esc(a.description||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.annonces.liste[${i}].description_nl=this.value">${esc(a.description_nl||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea onchange="contenu.annonces.liste[${i}].description_en=this.value">${esc(a.description_en||'')}</textarea></div>
      <div class="field"><label>Image (URL ou chemin)</label><input type="text" value="${esc(a.image||'')}" placeholder="/images/annonce.jpg" onchange="contenu.annonces.liste[${i}].image=this.value" /></div>
      <div class="toggle-row" style="margin-top:8px">
        <label>À la une (mise en avant)</label>
        <label class="toggle"><input type="checkbox" ${a.important?'checked':''} onchange="contenu.annonces.liste[${i}].important=this.checked" /><span class="toggle-slider"></span></label>
      </div>
    </div>
  `).join('');
}

function addAnnonce() {
  if (!contenu.annonces) contenu.annonces = { liste: [] };
  contenu.annonces.liste.unshift({ titre: 'Nouvelle annonce', date: '', description: '', description_nl: '', description_en: '', image: '', important: false });
  renderAnnonces();
}

function removeAnnonce(i) {
  if (!confirm('Supprimer cette annonce ?')) return;
  contenu.annonces.liste.splice(i, 1);
  renderAnnonces();
}

// ════════════ NAVETTE ════════════

function renderNavette() {
  const list = contenu.navette?.creneaux || [];
  const el = document.getElementById('navette-list');
  el.innerHTML = list.map((c, i) => `
    <div class="list-item">
      <div class="list-item-head">
        <h4>🚌 ${esc(c.jour||'')} — ${esc(c.horaire||'')}</h4>
        <button class="btn-del" onclick="removeNavette(${i})">🗑️ Supprimer</button>
      </div>
      <div class="grid3">
        <div class="field"><label>Jour <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(c.jour||'')}" onchange="contenu.navette.creneaux[${i}].jour=this.value;updateNavetteHead(${i})" /></div>
        <div class="field"><label>Jour <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(c.jour_nl||'')}" onchange="contenu.navette.creneaux[${i}].jour_nl=this.value" /></div>
        <div class="field"><label>Jour <span class="lang lang-en">EN</span></label><input type="text" value="${esc(c.jour_en||'')}" onchange="contenu.navette.creneaux[${i}].jour_en=this.value" /></div>
        <div class="field"><label>Horaire <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(c.horaire||'')}" onchange="contenu.navette.creneaux[${i}].horaire=this.value" /></div>
        <div class="field"><label>Horaire <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(c.horaire_nl||'')}" onchange="contenu.navette.creneaux[${i}].horaire_nl=this.value" /></div>
        <div class="field"><label>Horaire <span class="lang lang-en">EN</span></label><input type="text" value="${esc(c.horaire_en||c.horaire||'')}" onchange="contenu.navette.creneaux[${i}].horaire_en=this.value" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.navette.creneaux[${i}].description=this.value">${esc(c.description||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.navette.creneaux[${i}].description_nl=this.value">${esc(c.description_nl||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea onchange="contenu.navette.creneaux[${i}].description_en=this.value">${esc(c.description_en||'')}</textarea></div>
    </div>
  `).join('');
}

function addNavette() {
  if (!contenu.navette) contenu.navette = { creneaux: [] };
  contenu.navette.creneaux.push({ jour:'Dimanche', jour_nl:'Zondag', jour_en:'Sunday', horaire:'', horaire_nl:'', description:'', description_nl:'', description_en:'', principal:true });
  renderNavette();
}

function removeNavette(i) {
  if (!confirm('Supprimer ce créneau ?')) return;
  contenu.navette.creneaux.splice(i, 1);
  renderNavette();
}

// ════════════ DÉPARTEMENTS ════════════

function renderDepts() {
  const list = contenu.departements?.liste || [];
  const el = document.getElementById('dept-list');
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = list.map((d, i) => `
    <div class="list-item">
      <div class="list-item-head">
        <h4>🏢 ${esc(d.nom||'Sans nom')}</h4>
        <button class="btn-del" onclick="removeDept(${i})">🗑️ Supprimer</button>
      </div>
      <div class="grid2">
        <div class="field"><label>ID unique</label><input type="text" value="${esc(d.id||'')}" placeholder="ex: chorale" onchange="contenu.departements.liste[${i}].id=this.value" /><div class="field-hint">Sans espaces ni accents</div></div>
        <div class="field"><label>Photo (nom de fichier)</label><input type="text" value="${esc(d.photo||'')}" placeholder="ex: chorale.jpg" onchange="contenu.departements.liste[${i}].photo=this.value" /></div>
      </div>
      <div class="grid3">
        <div class="field"><label>Nom <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(d.nom||'')}" onchange="contenu.departements.liste[${i}].nom=this.value" /></div>
        <div class="field"><label>Nom <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(d.nom_nl||'')}" onchange="contenu.departements.liste[${i}].nom_nl=this.value" /></div>
        <div class="field"><label>Nom <span class="lang lang-en">EN</span></label><input type="text" value="${esc(d.nom_en||'')}" onchange="contenu.departements.liste[${i}].nom_en=this.value" /></div>
      </div>
      <div class="field"><label>Description <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.departements.liste[${i}].description=this.value">${esc(d.description||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.departements.liste[${i}].description_nl=this.value">${esc(d.description_nl||'')}</textarea></div>
      <div class="field"><label>Description <span class="lang lang-en">EN</span></label><textarea onchange="contenu.departements.liste[${i}].description_en=this.value">${esc(d.description_en||'')}</textarea></div>
    </div>
  `).join('');
}

function addDept() {
  if (!contenu.departements) contenu.departements = { liste: [] };
  contenu.departements.liste.push({ id:'nouveau', nom:'Nouveau', nom_nl:'Nieuw', nom_en:'New', description:'', description_nl:'', description_en:'', photo:'' });
  renderDepts();
}

function removeDept(i) {
  if (!confirm('Supprimer ce département ?')) return;
  contenu.departements.liste.splice(i, 1);
  renderDepts();
}

// ════════════ ÉQUIPE ════════════

function renderEquipe() {
  const list = contenu.equipe_pastorale?.membres || [];
  const el = document.getElementById('equipe-list');
  el.innerHTML = list.map((m, i) => `
    <div class="list-item">
      <div class="list-item-head">
        <h4>👤 ${esc(m.nom||'Sans nom')}</h4>
        <button class="btn-del" onclick="removeMembre(${i})">🗑️ Supprimer</button>
      </div>
      <div class="grid2">
        <div class="field"><label>Nom complet</label><input type="text" value="${esc(m.nom||'')}" onchange="contenu.equipe_pastorale.membres[${i}].nom=this.value" /></div>
        <div class="field"><label>Initiales</label><input type="text" value="${esc(m.initiales||'')}" placeholder="ex: GK" onchange="contenu.equipe_pastorale.membres[${i}].initiales=this.value" /></div>
        <div class="field"><label>Rôle <span class="lang lang-fr">FR</span></label><input type="text" value="${esc(m.role||'')}" onchange="contenu.equipe_pastorale.membres[${i}].role=this.value" /></div>
        <div class="field"><label>Rôle <span class="lang lang-nl">NL</span></label><input type="text" value="${esc(m.role_nl||'')}" onchange="contenu.equipe_pastorale.membres[${i}].role_nl=this.value" /></div>
        <div class="field"><label>Rôle <span class="lang lang-en">EN</span></label><input type="text" value="${esc(m.role_en||'')}" onchange="contenu.equipe_pastorale.membres[${i}].role_en=this.value" /></div>
      </div>
    </div>
  `).join('');
}

function addMembre() {
  if (!contenu.equipe_pastorale) contenu.equipe_pastorale = { membres: [] };
  contenu.equipe_pastorale.membres.push({ nom:'', initiales:'', role:'', role_nl:'', role_en:'' });
  renderEquipe();
}

function removeMembre(i) {
  if (!confirm('Supprimer ce membre ?')) return;
  contenu.equipe_pastorale.membres.splice(i, 1);
  renderEquipe();
}

// ════════════ TÉMOIGNAGES ════════════

function renderTemoignages() {
  const list = contenu.temoignages?.liste || [];
  const el = document.getElementById('temoignages-list');
  el.innerHTML = list.map((t, i) => `
    <div class="list-item">
      <div class="list-item-head">
        <h4>💬 ${esc(t.prenom||'Sans nom')} ${esc(t.initiales||'')}</h4>
        <button class="btn-del" onclick="removeTemoignage(${i})">🗑️ Supprimer</button>
      </div>
      <div class="grid2">
        <div class="field"><label>Prénom</label><input type="text" value="${esc(t.prenom||'')}" onchange="contenu.temoignages.liste[${i}].prenom=this.value" /></div>
        <div class="field"><label>Initiales</label><input type="text" value="${esc(t.initiales||'')}" onchange="contenu.temoignages.liste[${i}].initiales=this.value" /></div>
        <div class="field"><label>Rôle / Durée</label><input type="text" value="${esc(t.role||'')}" placeholder="ex: Membre depuis 2 ans" onchange="contenu.temoignages.liste[${i}].role=this.value" /></div>
      </div>
      <div class="field"><label>Témoignage <span class="lang lang-fr">FR</span></label><textarea onchange="contenu.temoignages.liste[${i}].texte=this.value">${esc(t.texte||'')}</textarea></div>
      <div class="field"><label>Témoignage <span class="lang lang-nl">NL</span></label><textarea onchange="contenu.temoignages.liste[${i}].texte_nl=this.value">${esc(t.texte_nl||'')}</textarea></div>
      <div class="field"><label>Témoignage <span class="lang lang-en">EN</span></label><textarea onchange="contenu.temoignages.liste[${i}].texte_en=this.value">${esc(t.texte_en||'')}</textarea></div>
    </div>
  `).join('');
}

function addTemoignage() {
  if (!contenu.temoignages) contenu.temoignages = { actif: false, liste: [] };
  contenu.temoignages.liste.push({ prenom:'', initiales:'', role:'', texte:'', texte_nl:'', texte_en:'' });
  renderTemoignages();
}

function removeTemoignage(i) {
  if (!confirm('Supprimer ce témoignage ?')) return;
  contenu.temoignages.liste.splice(i, 1);
  renderTemoignages();
}

// ════════════ SAVE / DOWNLOAD ════════════

function saveAll() {
  // Sync all data-path fields one last time
  document.querySelectorAll('[data-path]').forEach(el => {
    const v = el.type === 'checkbox' ? el.checked : el.value;
    setPath(contenu, el.dataset.path, v);
  });
  downloadJSON();
  toast('✓ contenu.json téléchargé ! Remplacez le fichier dans votre dépôt Git puis faites un commit.', 'success');
}

function downloadJSON() {
  const json = JSON.stringify(contenu, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'contenu.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ════════════ HELPERS ════════════

function bindField(el) {
  const val = getPath(contenu, el.dataset.path);
  if (el.type === 'checkbox') el.checked = !!val;
  else el.value = val || '';
  el.addEventListener('input', () => {
    setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value);
  });
  el.addEventListener('change', () => {
    setPath(contenu, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value);
  });
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 4500);
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === undefined || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
}
