/* ===== ANNONCES & COMMUNIQUÉS — Rendering ===== */
(function () {
  'use strict';

  const LANG = localStorage.getItem('cefcLang') || 'fr';

  const TYPE_LABELS = {
    annonce:  { fr: 'Annonce', nl: 'Aankondiging', en: 'Announcement' },
    activite: { fr: 'Activité',  nl: 'Activiteit',   en: 'Activity'     },
    necro:    { fr: 'Nécrologie', nl: 'Rouwbericht',  en: 'Obituary'     },
  };

  function t(item, key) {
    if (LANG !== 'fr') {
      const loc = item[key + '_' + LANG];
      if (loc) return loc;
    }
    return item[key] || '';
  }

  function typeLabel(type) {
    const map = TYPE_LABELS[type] || TYPE_LABELS.annonce;
    return map[LANG] || map.fr;
  }

  function typeIcon(type) {
    if (type === 'activite') return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    if (type === 'necro') return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 22V12M12 12C12 7 7 3 7 3C7 3 12 5 12 8V12ZM12 12C12 7 17 3 17 3C17 3 12 5 12 8"/></svg>';
    return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>';
  }

  function renderCard(item) {
    const type = item.type || 'annonce';
    const pinned = item.important;
    const titre = t(item, 'titre') || '—';
    const date = t(item, 'date') || '';
    const desc = t(item, 'description') || '';

    let metaHTML = `<div class="ann-card-meta">
      <span class="ann-type-badge badge-${type}">${typeIcon(type)} ${typeLabel(type)}</span>
      ${pinned ? '<span class="ann-pin-badge">📌 Important</span>' : ''}
    </div>`;

    let imageHTML = item.image ? `<img class="ann-card-img" src="${item.image}" alt="${titre}" loading="lazy" />` : '';

    let eventHTML = '';
    if (type === 'activite') {
      const rows = [];
      if (item.dateEvenement) rows.push(`<div class="ann-event-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${item.dateEvenement}</span></div>`);
      if (item.heureEvenement) rows.push(`<div class="ann-event-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>${item.heureEvenement}</span></div>`);
      if (item.lieuEvenement) rows.push(`<div class="ann-event-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>${item.lieuEvenement}</span></div>`);
      if (rows.length) eventHTML = `<div class="ann-event-info">${rows.join('')}</div>`;
    }

    return `<div class="ann-card type-${type}${pinned ? ' pinned' : ''}">
      ${imageHTML}
      <div class="ann-card-body">
        ${metaHTML}
        <div class="ann-card-title">${titre}</div>
        ${eventHTML}
        <div class="ann-card-desc">${desc}</div>
        ${date ? `<div class="ann-card-date">${date}</div>` : ''}
      </div>
    </div>`;
  }

  function showSkeleton() {
    const grid = document.getElementById('annoncesGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 6 }, () => `
      <div class="ann-skeleton">
        <div class="ann-skel-inner">
          <div class="skel-line" style="height:18px;width:40%;"></div>
          <div class="skel-line" style="height:24px;width:80%;"></div>
          <div class="skel-line" style="height:14px;width:100%;"></div>
          <div class="skel-line" style="height:14px;width:90%;"></div>
          <div class="skel-line" style="height:14px;width:70%;"></div>
        </div>
      </div>`).join('');
  }

  let allItems = [];
  let activeFilter = 'tout';

  function renderFiltered() {
    const grid = document.getElementById('annoncesGrid');
    if (!grid) return;
    const filtered = activeFilter === 'tout' ? allItems : allItems.filter(i => i.type === activeFilter);
    if (!filtered.length) {
      grid.innerHTML = `<div class="annonces-empty" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3>Aucune annonce</h3>
        <p>Revenez bientôt — les nouvelles annonces seront publiées ici.</p>
      </div>`;
      return;
    }
    grid.innerHTML = filtered.map(renderCard).join('');
    grid.querySelectorAll('.ann-card').forEach(el => el.classList.add('reveal', 'in'));
  }

  function updateCountBadges() {
    const counts = { tout: allItems.length, annonce: 0, activite: 0, necro: 0 };
    allItems.forEach(i => { if (counts[i.type] !== undefined) counts[i.type]++; });
    document.querySelectorAll('.ann-filter-pill').forEach(pill => {
      const f = pill.dataset.filter;
      const badge = pill.querySelector('.pill-count');
      if (badge) badge.textContent = counts[f] || 0;
    });
  }

  function init() {
    const grid = document.getElementById('annoncesGrid');
    if (!grid) return;
    showSkeleton();

    fetch('/contenu.json')
      .then(r => r.json())
      .then(data => {
        const liste = (data.annonces && data.annonces.liste) ? data.annonces.liste : [];
        allItems = liste
          .map(item => ({ type: 'annonce', ...item }))
          .sort((a, b) => {
            if (a.important && !b.important) return -1;
            if (!a.important && b.important) return 1;
            return 0;
          });
        updateCountBadges();
        renderFiltered();
      })
      .catch(() => {
        grid.innerHTML = `<div class="annonces-empty" style="grid-column:1/-1">
          <h3>Erreur de chargement</h3>
          <p>Impossible de charger les annonces. Veuillez réessayer.</p>
        </div>`;
      });

    document.querySelectorAll('.ann-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.ann-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFilter = pill.dataset.filter;
        renderFiltered();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
