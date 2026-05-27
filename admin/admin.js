// Admin Dashboard for CEFC Alost
// Manages content editing and JSON persistence

let contenu = {};
let hasChanges = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  await loadContent();
  setupTabButtons();
  renderAnnonces();
  renderHoraires();
  renderLive();
  renderMessages();
  renderJeunesse();
  renderDepartements();
  renderDivers();
});

// Authentication check
function checkAuth() {
  // Check if user is logged in via Netlify Identity
  if (!window.netlifyIdentity || !window.netlifyIdentity.currentUser()) {
    // Redirect to login if not authenticated
    window.location.href = '/';
  }
}

// Load content from JSON
async function loadContent() {
  try {
    const response = await fetch('/contenu.json');
    if (!response.ok) throw new Error('Failed to load contenu.json');
    contenu = await response.json();
  } catch (error) {
    showStatus('Erreur: impossible de charger le contenu', 'error');
    console.error('Error loading content:', error);
  }
}

// Tab switching
function setupTabButtons() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Update active button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');
    });
  });
}

// Status messages
function showStatus(msg, type = 'success') {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = `status-message show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ANNONCES SECTION
function renderAnnonces() {
  const list = document.getElementById('annonces-list');
  if (!contenu.annonces || !contenu.annonces.liste) {
    list.innerHTML = '<p>Pas d\'annonces</p>';
    return;
  }

  list.innerHTML = contenu.annonces.liste.map((item, idx) => `
    <div class="item-card" id="annonce-${idx}">
      <h4>📌 ${item.titre || 'Sans titre'}</h4>
      <div class="item-fields">
        <div class="form-group">
          <label>Titre</label>
          <input type="text" value="${item.titre || ''}" onchange="updateAnnonce(${idx}, 'titre', this.value)">
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="text" value="${item.date || ''}" onchange="updateAnnonce(${idx}, 'date', this.value)">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea onchange="updateAnnonce(${idx}, 'description', this.value)">${item.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Image (URL ou chemin)</label>
          <input type="text" value="${item.image || ''}" onchange="updateAnnonce(${idx}, 'image', this.value)">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" ${item.important ? 'checked' : ''} onchange="updateAnnonce(${idx}, 'important', this.checked)">
            À la une (important)
          </label>
        </div>
      </div>
      <div class="item-actions">
        <button class="danger" onclick="removeAnnonce(${idx})">🗑️ Supprimer</button>
      </div>
    </div>
  `).join('');
}

function updateAnnonce(idx, field, value) {
  if (!contenu.annonces) contenu.annonces = { liste: [] };
  if (!contenu.annonces.liste[idx]) return;
  contenu.annonces.liste[idx][field] = value;
  hasChanges = true;
}

function removeAnnonce(idx) {
  if (confirm('Supprimer cette annonce?')) {
    contenu.annonces.liste.splice(idx, 1);
    hasChanges = true;
    renderAnnonces();
  }
}

function addNewAnnonce() {
  if (!contenu.annonces) contenu.annonces = { liste: [] };
  contenu.annonces.liste.push({
    titre: 'Nouvelle annonce',
    date: new Date().toISOString().split('T')[0],
    description: '',
    image: '',
    important: false
  });
  hasChanges = true;
  renderAnnonces();
}

// HORAIRES SECTION
function renderHoraires() {
  const content = document.getElementById('horaires-content');

  if (!contenu.horaires) {
    content.innerHTML = '<p>Pas de données horaires</p>';
    return;
  }

  let html = `
    <div class="form-section">
      <h3>Services & Cultes</h3>
      <div class="item-fields">
  `;

  if (contenu.horaires.liste) {
    contenu.horaires.liste.forEach((service, idx) => {
      html += `
        <div class="item-card">
          <h4>${service.jour || 'Sans jour'} — ${service.horaire || 'Sans horaire'}</h4>
          <div class="item-fields">
            <div class="grid-2">
              <div class="form-group">
                <label>Jour (FR)</label>
                <input type="text" value="${service.jour || ''}" onchange="updateHoraire(${idx}, 'jour', this.value)">
              </div>
              <div class="form-group">
                <label>Jour (NL)</label>
                <input type="text" value="${service.jour_nl || ''}" onchange="updateHoraire(${idx}, 'jour_nl', this.value)">
              </div>
              <div class="form-group">
                <label>Horaire</label>
                <input type="text" value="${service.horaire || ''}" onchange="updateHoraire(${idx}, 'horaire', this.value)">
              </div>
              <div class="form-group">
                <label>Horaire (NL)</label>
                <input type="text" value="${service.horaire_nl || ''}" onchange="updateHoraire(${idx}, 'horaire_nl', this.value)">
              </div>
            </div>
            <div class="form-group">
              <label>Description (FR)</label>
              <textarea onchange="updateHoraire(${idx}, 'description', this.value)">${service.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Description (NL)</label>
              <textarea onchange="updateHoraire(${idx}, 'description_nl', this.value)">${service.description_nl || ''}</textarea>
            </div>
            <div class="item-actions">
              <button class="danger" onclick="removeHoraire(${idx})">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
      <button class="add-btn" style="margin-top: 12px;" onclick="addNewHoraire()">+ Ajouter un créneau</button>
    </div>
  `;

  content.innerHTML = html;
}

function updateHoraire(idx, field, value) {
  if (!contenu.horaires) contenu.horaires = { liste: [] };
  if (!contenu.horaires.liste[idx]) return;
  contenu.horaires.liste[idx][field] = value;
  hasChanges = true;
}

function removeHoraire(idx) {
  if (confirm('Supprimer ce créneau?')) {
    contenu.horaires.liste.splice(idx, 1);
    hasChanges = true;
    renderHoraires();
  }
}

function addNewHoraire() {
  if (!contenu.horaires) contenu.horaires = { liste: [] };
  contenu.horaires.liste.push({
    jour: 'Dimanche',
    jour_nl: 'Zondag',
    jour_en: 'Sunday',
    horaire: '10h00',
    horaire_nl: '10u00',
    horaire_en: '10:00 AM',
    description: 'Nouvelle description',
    description_nl: 'Nieuwe beschrijving',
    description_en: 'New description',
    principal: true
  });
  hasChanges = true;
  renderHoraires();
}

// LIVE SECTION
function renderLive() {
  const content = document.getElementById('live-content');

  if (!contenu.live) {
    content.innerHTML = '<p>Pas de données live</p>';
    return;
  }

  content.innerHTML = `
    <div class="form-section">
      <h3>Configuration du Live</h3>
      <div class="form-group">
        <label>URL YouTube Live</label>
        <input type="text" value="${contenu.live.url || ''}" onchange="updateLive('url', this.value)">
        <div class="helper-text">Ex: https://www.youtube.com/@CE_laFamilleChretienne</div>
      </div>
      <div class="form-group">
        <label>Statut du Live</label>
        <select onchange="updateLive('actif', this.value === 'true')">
          <option value="false" ${!contenu.live.actif ? 'selected' : ''}>Inactif</option>
          <option value="true" ${contenu.live.actif ? 'selected' : ''}>Actif</option>
        </select>
      </div>
      <div class="form-group">
        <label>Titre du Live</label>
        <input type="text" value="${contenu.live.titre || ''}" onchange="updateLive('titre', this.value)">
      </div>
    </div>
  `;
}

function updateLive(field, value) {
  if (!contenu.live) contenu.live = {};
  contenu.live[field] = value;
  hasChanges = true;
}

// MESSAGES SECTION
function renderMessages() {
  const content = document.getElementById('messages-content');

  let html = '<div class="form-section"><h3>Messages & Bannières</h3>';

  if (contenu.message_pasteur) {
    html += `
      <h4>Message du Pasteur</h4>
      <div class="form-group">
        <label>Texte (FR)</label>
        <textarea onchange="updateMessage('message_pasteur', 'texte', this.value)">${contenu.message_pasteur.texte || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Texte (NL)</label>
        <textarea onchange="updateMessage('message_pasteur', 'texte_nl', this.value)">${contenu.message_pasteur.texte_nl || ''}</textarea>
      </div>
    `;
  }

  if (contenu.banniere) {
    html += `
      <h4 style="margin-top: 20px;">Bannière</h4>
      <div class="form-group">
        <label>Titre (FR)</label>
        <input type="text" value="${contenu.banniere.titre || ''}" onchange="updateMessage('banniere', 'titre', this.value)">
      </div>
      <div class="form-group">
        <label>Titre (NL)</label>
        <input type="text" value="${contenu.banniere.titre_nl || ''}" onchange="updateMessage('banniere', 'titre_nl', this.value)">
      </div>
      <div class="form-group">
        <label>Sous-titre (FR)</label>
        <input type="text" value="${contenu.banniere.sous_titre || ''}" onchange="updateMessage('banniere', 'sous_titre', this.value)">
      </div>
      <div class="form-group">
        <label>Sous-titre (NL)</label>
        <input type="text" value="${contenu.banniere.sous_titre_nl || ''}" onchange="updateMessage('banniere', 'sous_titre_nl', this.value)">
      </div>
    `;
  }

  html += '</div>';
  content.innerHTML = html;
}

function updateMessage(section, field, value) {
  if (!contenu[section]) contenu[section] = {};
  contenu[section][field] = value;
  hasChanges = true;
}

// JEUNESSE SECTION
function renderJeunesse() {
  const content = document.getElementById('jeunesse-content');

  if (!contenu.jefc) {
    content.innerHTML = '<p>Pas de données JEFC</p>';
    return;
  }

  content.innerHTML = `
    <div class="form-section">
      <h3>JEFC - Jeunesse Évangélique</h3>
      <div class="form-group">
        <label>Titre (FR)</label>
        <input type="text" value="${contenu.jefc.titre || ''}" onchange="updateJeunesse('titre', this.value)">
      </div>
      <div class="form-group">
        <label>Texte (FR)</label>
        <textarea onchange="updateJeunesse('texte', this.value)">${contenu.jefc.texte || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Fréquence (FR)</label>
        <input type="text" value="${contenu.jefc.frequence || ''}" onchange="updateJeunesse('frequence', this.value)">
      </div>
      <div class="form-group">
        <label>Lieu</label>
        <input type="text" value="${contenu.jefc.lieu || ''}" onchange="updateJeunesse('lieu', this.value)">
      </div>
    </div>
  `;
}

function updateJeunesse(field, value) {
  if (!contenu.jefc) contenu.jefc = {};
  contenu.jefc[field] = value;
  hasChanges = true;
}

// DEPARTEMENTS SECTION
function renderDepartements() {
  const list = document.getElementById('departements-list');
  if (!contenu.departements || !contenu.departements.liste) {
    list.innerHTML = '<p>Pas de départements</p>';
    return;
  }

  list.innerHTML = contenu.departements.liste.map((item, idx) => `
    <div class="item-card">
      <h4>🏢 ${item.nom || 'Sans nom'}</h4>
      <div class="item-fields">
        <div class="grid-2">
          <div class="form-group">
            <label>ID</label>
            <input type="text" value="${item.id || ''}" onchange="updateDeptField(${idx}, 'id', this.value)">
          </div>
          <div class="form-group">
            <label>Nom (FR)</label>
            <input type="text" value="${item.nom || ''}" onchange="updateDeptField(${idx}, 'nom', this.value)">
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Nom (NL)</label>
            <input type="text" value="${item.nom_nl || ''}" onchange="updateDeptField(${idx}, 'nom_nl', this.value)">
          </div>
          <div class="form-group">
            <label>Nom (EN)</label>
            <input type="text" value="${item.nom_en || ''}" onchange="updateDeptField(${idx}, 'nom_en', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label>Description (FR)</label>
          <textarea onchange="updateDeptField(${idx}, 'description', this.value)">${item.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Description (NL)</label>
          <textarea onchange="updateDeptField(${idx}, 'description_nl', this.value)">${item.description_nl || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Description (EN)</label>
          <textarea onchange="updateDeptField(${idx}, 'description_en', this.value)">${item.description_en || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Photo (nom du fichier)</label>
          <input type="text" value="${item.photo || ''}" onchange="updateDeptField(${idx}, 'photo', this.value)">
          <div class="helper-text">Ex: technique.jpg</div>
        </div>
      </div>
      <div class="item-actions">
        <button class="danger" onclick="removeDeptement(${idx})">🗑️ Supprimer</button>
      </div>
    </div>
  `).join('');
}

function updateDeptField(idx, field, value) {
  if (!contenu.departements) contenu.departements = { liste: [] };
  if (!contenu.departements.liste[idx]) return;
  contenu.departements.liste[idx][field] = value;
  hasChanges = true;
}

function removeDeptement(idx) {
  if (confirm('Supprimer ce département?')) {
    contenu.departements.liste.splice(idx, 1);
    hasChanges = true;
    renderDepartements();
  }
}

function addNewDepartement() {
  if (!contenu.departements) contenu.departements = { liste: [] };
  contenu.departements.liste.push({
    id: 'new-dept',
    nom: 'Nouveau Département',
    nom_nl: 'Nieuwe Afdeling',
    nom_en: 'New Department',
    description: 'Description...',
    description_nl: 'Beschrijving...',
    description_en: 'Description...',
    photo: 'placeholder.jpg'
  });
  hasChanges = true;
  renderDepartements();
}

// DIVERS SECTION
function renderDivers() {
  const content = document.getElementById('divers-content');

  let html = `
    <div class="form-section">
      <h3>Vision & Mission</h3>
  `;

  if (contenu.vision_mission) {
    html += `
      <div class="form-group">
        <label>Vision (FR)</label>
        <textarea onchange="updateDivers('vision_mission', 'vision', this.value)">${contenu.vision_mission.vision || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Vision (NL)</label>
        <textarea onchange="updateDivers('vision_mission', 'vision_nl', this.value)">${contenu.vision_mission.vision_nl || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Mission (FR)</label>
        <textarea onchange="updateDivers('vision_mission', 'mission', this.value)">${contenu.vision_mission.mission || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Mission (NL)</label>
        <textarea onchange="updateDivers('vision_mission', 'mission_nl', this.value)">${contenu.vision_mission.mission_nl || ''}</textarea>
      </div>
    `;
  }

  html += `
    </div>
    <div class="form-section">
      <h3>Footer</h3>
  `;

  if (contenu.footer) {
    html += `
      <div class="form-group">
        <label>Verset (FR)</label>
        <textarea onchange="updateDivers('footer', 'verset', this.value)">${contenu.footer.verset || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Référence verset</label>
        <input type="text" value="${contenu.footer.verset_ref || ''}" onchange="updateDivers('footer', 'verset_ref', this.value)">
      </div>
      <div class="form-group">
        <label>Copyright</label>
        <input type="text" value="${contenu.footer.copyright || ''}" onchange="updateDivers('footer', 'copyright', this.value)">
      </div>
    `;
  }

  html += '</div>';
  content.innerHTML = html;
}

function updateDivers(section, field, value) {
  if (!contenu[section]) contenu[section] = {};
  contenu[section][field] = value;
  hasChanges = true;
}

// Save content
async function saveContent() {
  try {
    // This would need a backend to actually save to the server
    // For now, we'll just download it and instruct the user to commit
    downloadAllJSON();
    showStatus('Contenu prêt à être téléchargé. Remplacez contenu.json et commitez les changements.', 'success');
  } catch (error) {
    showStatus('Erreur lors de la sauvegarde', 'error');
    console.error('Error saving:', error);
  }
}

// Download functions
function downloadJSON(section) {
  let data = {};

  if (section === 'all') {
    data = contenu;
  } else if (section === 'annonces') {
    data = { annonces: contenu.annonces };
  } else if (section === 'departements') {
    data = { departements: contenu.departements };
  } else {
    data = contenu;
  }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'contenu.json', 'application/json');
}

function downloadAllJSON() {
  const json = JSON.stringify(contenu, null, 2);
  downloadFile(json, 'contenu.json', 'application/json');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Logout
function logoutAdmin() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
  window.location.href = '/';
}
