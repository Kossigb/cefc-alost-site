// ════════════════════════════════════════
//  Chris Business & Chrisfoot — Admin Dashboard
//  Auth: Netlify Identity | Save: GitHub API
// ════════════════════════════════════════

const REPO      = 'kossigb/cefc-alost-site';
const BRANCH    = 'claude/new-site-bdu2ep';
const DATA_PATH = 'chris-business-drc/data.json';

let siteData = {};

// ════════════ AUTH ════════════

document.addEventListener('DOMContentLoaded', () => {
  if (!window.netlifyIdentity) {
    document.getElementById('login-screen').innerHTML =
      '<div style="color:#fca5a5;text-align:center;padding:40px">Netlify Identity non disponible.<br>Vérifiez votre connexion, ou que Netlify Identity est activé pour ce site.</div>';
    return;
  }
  window.netlifyIdentity.on('init',  user => { if (user) showApp(user); });
  window.netlifyIdentity.on('login', user => { window.netlifyIdentity.close(); showApp(user); });
  window.netlifyIdentity.on('logout', () => {
    document.getElementById('admin-app').classList.remove('open');
    document.getElementById('login-screen').style.display = 'flex';
  });
});

function openLogin() {
  window.netlifyIdentity && window.netlifyIdentity.open('login');
}

function doLogout() {
  window.netlifyIdentity && window.netlifyIdentity.logout();
}

async function showApp(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.add('open');
  document.getElementById('admin-username').textContent = user.email || 'Admin';
  setupNav();
  await loadContent();
  populateAll();
  loadUsers();
  refreshTokenStatus();
}

// ════════════ GITHUB API ════════════

function getGHToken() { return localStorage.getItem('cb_gh_token') || ''; }
function saveGHToken(t) { localStorage.setItem('cb_gh_token', t.trim()); }

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

async function ghGetTextFile(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { Accept: 'application/vnd.github.v3.raw' }
  });
  if (!res.ok) throw new Error(`Impossible de lire ${path} (${res.status})`);
  return res.text();
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
  el.className = 'badge-status ' + (t ? 'badge-green' : 'badge-red');
}

function clearToken() {
  localStorage.removeItem('cb_gh_token');
  refreshTokenStatus();
  toast('Token supprimé.', 'success');
}

// ════════════ USERS (Netlify Identity) ════════════

async function loadUsers() {
  const el = document.getElementById('users-list');
  if (!el) return;
  const user = window.netlifyIdentity?.currentUser();
  try {
    const token = await user.jwt();
    const res = await fetch('/.netlify/identity/admin/users?per_page=50', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const users = data.users || data || [];
    el.innerHTML = users.map(u => `
      <div class="list-item">
        <div class="list-item-head"><h4>${esc(u.email)}</h4></div>
        <p class="field-hint">Rôle : ${esc((u.app_metadata && u.app_metadata.roles || []).join(', ') || 'aucun')} · Créé le ${new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
      </div>
    `).join('') || '<p class="field-hint">Aucun utilisateur.</p>';
  } catch {
    el.innerHTML = `<p style="font-size:13px;color:var(--text2)">Liste indisponible ici. <a href="https://app.netlify.com/" target="_blank" style="color:#d94a44">Gérer sur Netlify →</a></p>`;
  }
}

async function inviteUser() {
  const email = document.getElementById('invite-email').value.trim();
  const resultEl = document.getElementById('invite-result');
  if (!email) { resultEl.textContent = 'Entrez un email.'; return; }
  const user = window.netlifyIdentity?.currentUser();
  try {
    const token = await user.jwt();
    const res = await fetch('/.netlify/identity/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      resultEl.textContent = `✓ Invitation envoyée à ${email}.`;
      document.getElementById('invite-email').value = '';
      loadUsers();
    } else {
      throw new Error();
    }
  } catch {
    resultEl.innerHTML = `Droits insuffisants ici. <a href="https://app.netlify.com/" target="_blank" style="color:#d94a44">Inviter sur Netlify →</a>`;
  }
}

// ════════════ SAVE ALL → GITHUB ════════════

async function saveAll() {
  document.querySelectorAll('[data-path]').forEach(el => {
    setPath(siteData, el.dataset.path, el.value);
  });
  if (!getGHToken()) {
    toast('⚠ Token GitHub requis — configurez-le dans ⚙ Paramètres.', 'error');
    switchPage('parametres'); return;
  }
  const btns = document.querySelectorAll('.save-btn');
  btns.forEach(b => { b._orig = b.textContent; b.textContent = '⏳ Publication…'; b.disabled = true; });
  try {
    await ghCommitText(DATA_PATH, JSON.stringify(siteData, null, 2), 'Mise à jour du contenu via admin Chris Business');
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
      switchPage(item.dataset.page);
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
    // Try GitHub first (source of truth, always fresh even right after a commit).
    if (getGHToken()) {
      siteData = JSON.parse(await ghGetTextFile(DATA_PATH));
      return;
    }
    throw new Error('no-token');
  } catch {
    try {
      const r = await fetch('../data.json?t=' + Date.now());
      siteData = await r.json();
    } catch {
      toast('Impossible de charger data.json', 'error');
      siteData = {};
    }
  }
}

// ════════════ POPULATE FIELDS ════════════

function populateAll() {
  document.querySelectorAll('[data-path]').forEach(bindField);

  renderList('home-axes-list', 'home.axes.items', [
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' },
    { key: 'link', label: 'Texte du lien', type: 'text' }
  ], item => item.title || 'Axe');

  renderList('home-direction-people-list', 'home.direction.people', [
    { key: 'initials', label: 'Initiales', type: 'text' },
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'role', label: 'Rôle', type: 'text' }
  ], item => item.name || 'Personne');

  renderList('home-services-list', 'home.services.items', [
    { key: 'number', label: 'Numéro', type: 'text' },
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' }
  ], item => item.title || 'Service');

  renderList('chrisbusiness-clients-list', 'chrisBusiness.clients.items', [
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'logo', label: 'Logo (chemin image)', type: 'text' }
  ], item => item.name || 'Client');

  renderList('chrisbusiness-objectifs-list', 'chrisBusiness.objectifs.items', [
    { key: 'marker', label: 'Repère (A, B, C…)', type: 'text' },
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' }
  ], item => item.title || 'Objectif');

  renderList('chrisbusiness-fondations-list', 'chrisBusiness.fondations.items', [
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' },
    { key: 'logo', label: 'Logo (chemin image)', type: 'text' }
  ], item => item.name || 'Fondation');

  renderList('chrisfoot-international-list', 'chrisFoot.international.items', [
    { key: 'name', label: 'Nom du club', type: 'text' },
    { key: 'badge', label: 'Pays', type: 'text' },
    { key: 'logo', label: 'Logo (chemin image)', type: 'text' }
  ], item => item.name || 'Club');

  renderList('partenariats-visibilite-list', 'partenariats.visibilite.items', [
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'title', label: 'Titre', type: 'text' }
  ], item => item.title || 'Élément');

  renderList('partenariats-medical-list', 'partenariats.medical.items', [
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'title', label: 'Titre', type: 'text' }
  ], item => item.title || 'Institution');

  renderList('apropos-equipe-list', 'apropos.equipe.people', [
    { key: 'initials', label: 'Initiales', type: 'text' },
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'role', label: 'Rôle', type: 'text' }
  ], item => item.name || 'Personne');

  renderList('apropos-mission-list', 'apropos.mission.items', [
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' }
  ], item => item.title || 'Axe');

  renderList('apropos-faq-list', 'apropos.faq.items', [
    { key: 'question', label: 'Question', type: 'text' },
    { key: 'answer', label: 'Réponse', type: 'textarea' }
  ], item => item.question || 'Question');
}

function bindField(el) {
  const val = getPath(siteData, el.dataset.path);
  el.value = val || '';
  el.addEventListener('input', () => setPath(siteData, el.dataset.path, el.value));
  el.addEventListener('change', () => setPath(siteData, el.dataset.path, el.value));
}

// ════════════ GENERIC LIST EDITOR ════════════

function renderList(containerId, path, fields, labelFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const list = getPath(siteData, path) || [];
  if (!list.length) {
    el.innerHTML = '<p style="color:var(--text2);font-size:14px;margin-bottom:8px">Aucun élément.</p>';
    return;
  }
  el.innerHTML = list.map((item, i) => `
    <div class="list-item">
      <div class="list-item-head">
        <h4>${esc(labelFn(item))}</h4>
        <button class="btn-del" onclick="removeListItem('${path}', ${i}, '${containerId}')">🗑️ Supprimer</button>
      </div>
      ${fields.map(f => `
        <div class="field">
          <label>${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea onchange="setListItemField('${path}', ${i}, '${f.key}', this.value, '${containerId}')">${esc(item[f.key] || '')}</textarea>`
            : `<input type="text" value="${esc(item[f.key] || '')}" onchange="setListItemField('${path}', ${i}, '${f.key}', this.value, '${containerId}')" />`
          }
        </div>
      `).join('')}
    </div>
  `).join('');
}

function setListItemField(path, index, key, value, containerId) {
  const list = getPath(siteData, path);
  if (!list || !list[index]) return;
  list[index][key] = value;
  // Refresh just the item's header label without losing focus elsewhere isn't critical;
  // header label updates on next full render (add/remove/page switch).
}

function addListItem(path, template) {
  let list = getPath(siteData, path);
  if (!Array.isArray(list)) { list = []; setPath(siteData, path, list); }
  list.push(Object.assign({}, template));
  populateAll();
}

function removeListItem(path, index, containerId) {
  const list = getPath(siteData, path);
  if (!list) return;
  if (!confirm('Supprimer cet élément ?')) return;
  list.splice(index, 1);
  populateAll();
}

// ════════════ HELPERS ════════════

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let toastTimer;
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = type;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}
