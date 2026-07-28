/* ===== COMMAND PALETTE (Ctrl+K / Cmd+K) ===== */
(function () {
  'use strict';

  const PAGES = [
    { label: 'Accueil', url: '/', sub: 'Page principale de l\'église', icon: 'home' },
    { label: 'Services & Horaires', url: '/services.html', sub: 'Dimanche 10h · Mercredi 18h · Vendredi 18h', icon: 'clock' },
    { label: 'Annonces & Communiqués', url: '/annonces.html', sub: 'Annonces, activités et communiqués de deuil', icon: 'megaphone' },
    { label: 'Jeunesse (JEFC)', url: '/jeunesse.html', sub: 'Jeunesse Évangélique · toutes les 2 semaines', icon: 'star' },
    { label: 'Navette gratuite', url: '/navette.html', sub: 'Transport gratuit depuis la Gare d\'Alost', icon: 'bus' },
    { label: 'Départements', url: '/departements.html', sub: 'Technique, Chorale, Accueil, Intercesseurs…', icon: 'grid' },
    { label: 'Dons', url: '/dons.html', sub: 'Soutenir la vision et le ministère de l\'église', icon: 'heart' },
    { label: 'Contact', url: '/contact.html', sub: 'Nous écrire ou nous rendre visite', icon: 'mail' },
    { label: 'Anniversaires', url: '/anniversaire.html', sub: 'Calendrier des anniversaires', icon: 'gift' },
  ];

  const ACTIONS = [
    { label: 'Rejoindre le live YouTube', sub: 'Ouvrir la chaîne YouTube CEFC', icon: 'play', action: () => window.open('https://www.youtube.com/@CE_laFamilleChretienne', '_blank') },
    { label: 'Partager le verset du jour', sub: 'Générer une image à partager', icon: 'share', action: () => { document.dispatchEvent(new CustomEvent('cefc:verse-share')); close(); } },
    { label: 'Faire un don', sub: 'Soutenir l\'église en ligne', icon: 'heart', action: () => { window.location.href = '/dons.html'; } },
  ];

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    megaphone: '<path d="M13 2l-2 4-4 1 3 3-1 4 4-2 4 2-1-4 3-3-4-1z"/><path d="M8.5 14.5L3 22"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    bus: '<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  };

  function icon(name, size) {
    size = size || 16;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  function highlight(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + '<span class="cmdk-match">' + text.slice(idx, idx + query.length) + '</span>' + text.slice(idx + query.length);
  }

  function score(item, q) {
    if (!q) return 1;
    const lq = q.toLowerCase();
    const l = item.label.toLowerCase();
    const ls = (item.sub || '').toLowerCase();
    if (l.startsWith(lq)) return 3;
    if (l.includes(lq)) return 2;
    if (ls.includes(lq)) return 1;
    return 0;
  }

  let activeIdx = 0;
  let currentItems = [];
  let overlay, input;

  function buildHTML() {
    const div = document.createElement('div');
    div.id = 'cefcCmdk';
    div.innerHTML = `
      <div class="cmdk-backdrop" id="cefcCmdkBackdrop"></div>
      <div class="cmdk-box" role="dialog" aria-modal="true" aria-label="Recherche rapide">
        <div class="cmdk-input-row">
          ${icon('search', 18)}
          <input type="text" id="cefcCmdkInput" placeholder="Rechercher une page, une action…" autocomplete="off" spellcheck="false" />
          <kbd class="cmdk-esc-key">esc</kbd>
        </div>
        <div class="cmdk-results" id="cefcCmdkResults"></div>
        <div class="cmdk-footer-bar">
          <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>esc</kbd> fermer</span>
        </div>
      </div>`;
    document.body.appendChild(div);

    const style = document.createElement('style');
    style.textContent = `
      #cefcCmdk { position:fixed; inset:0; z-index:9999; display:flex; align-items:flex-start; justify-content:center; padding-top:12vh; }
      #cefcCmdk.cmdk-hidden { display:none; }
      .cmdk-backdrop { position:fixed; inset:0; background:rgba(5,5,18,0.60); backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px); }
      .cmdk-box {
        position:relative; z-index:1; width:100%; max-width:560px; margin:0 18px;
        background:rgba(26,27,62,0.92); border:0.5px solid rgba(227,227,235,0.14);
        border-radius:16px; box-shadow:0 32px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(167,139,250,0.07);
        overflow:hidden; animation:cmdk-drop 0.28s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes cmdk-drop { from { opacity:0; transform:translateY(-10px) scale(0.98); } to { opacity:1; transform:none; } }
      .cmdk-input-row {
        display:flex; align-items:center; gap:12px;
        padding:17px 20px; border-bottom:0.5px solid rgba(227,227,235,0.1);
      }
      .cmdk-input-row svg { color:rgba(227,227,235,0.4); flex-shrink:0; }
      #cefcCmdkInput {
        flex:1; background:none; border:none; outline:none;
        font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; font-size:16px;
        color:#E3E3EB; caret-color:#A78BFA;
      }
      #cefcCmdkInput::placeholder { color:rgba(227,227,235,0.3); }
      .cmdk-esc-key {
        font-size:11px; padding:3px 7px; border-radius:5px;
        border:0.5px solid rgba(227,227,235,0.15); color:rgba(227,227,235,0.35);
        background:none; font-family:inherit; flex-shrink:0;
      }
      .cmdk-results { max-height:340px; overflow-y:auto; padding:6px; }
      .cmdk-group-label {
        font-size:10.5px; letter-spacing:0.16em; text-transform:uppercase;
        color:rgba(227,227,235,0.3); padding:10px 12px 5px;
        font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      }
      .cmdk-item {
        display:flex; align-items:center; gap:12px;
        padding:11px 12px; border-radius:10px; cursor:pointer;
        transition:background 0.12s; color:rgba(227,227,235,0.75);
        font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      }
      .cmdk-item:hover, .cmdk-item.cmdk-active { background:rgba(167,139,250,0.14); color:#E3E3EB; }
      .cmdk-item.cmdk-active { box-shadow:inset 0 0 0 1px rgba(167,139,250,0.25); }
      .cmdk-item .cmdk-ico {
        width:30px; height:30px; border-radius:8px; flex-shrink:0;
        background:rgba(227,227,235,0.06); border:0.5px solid rgba(227,227,235,0.12);
        display:flex; align-items:center; justify-content:center; color:rgba(227,227,235,0.55);
      }
      .cmdk-item.cmdk-active .cmdk-ico { background:rgba(167,139,250,0.2); border-color:rgba(167,139,250,0.35); color:#A78BFA; }
      .cmdk-item-text { flex:1; min-width:0; }
      .cmdk-item-label { font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .cmdk-item-sub { font-size:12px; color:rgba(227,227,235,0.35); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .cmdk-item.cmdk-active .cmdk-item-sub { color:rgba(227,227,235,0.5); }
      .cmdk-match { color:#A78BFA; font-weight:600; }
      .cmdk-item-kbd { font-size:11px; font-weight:600; padding:2px 6px; border-radius:5px; background:rgba(227,227,235,0.08); border:0.5px solid rgba(227,227,235,0.14); color:rgba(227,227,235,0.4); flex-shrink:0; font-family:inherit; }
      .cmdk-empty { text-align:center; padding:32px; font-size:14px; color:rgba(227,227,235,0.3); font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; }
      .cmdk-footer-bar {
        display:flex; gap:18px; padding:11px 18px;
        border-top:0.5px solid rgba(227,227,235,0.08);
        font-size:11.5px; color:rgba(227,227,235,0.35);
        font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      }
      .cmdk-footer-bar span { display:flex; align-items:center; gap:5px; }
      .cmdk-footer-bar kbd { font-size:10.5px; font-weight:600; padding:2px 5px; border-radius:4px; background:rgba(227,227,235,0.08); border:0.5px solid rgba(227,227,235,0.14); font-family:inherit; }
    `;
    document.head.appendChild(style);

    return div;
  }

  function render(q) {
    const results = document.getElementById('cefcCmdkResults');
    currentItems = [];
    let html = '';

    const pages = PAGES.filter(p => score(p, q) > 0).sort((a, b) => score(b, q) - score(a, q));
    const actions = ACTIONS.filter(a => score(a, q) > 0).sort((a, b) => score(b, q) - score(a, q));

    if (!pages.length && !actions.length) {
      results.innerHTML = '<div class="cmdk-empty">Aucun résultat pour « ' + q + ' »</div>';
      return;
    }

    if (pages.length) {
      html += '<div class="cmdk-group-label">Pages</div>';
      pages.forEach(p => {
        const idx = currentItems.length;
        currentItems.push({ type: 'page', item: p });
        html += `<div class="cmdk-item${idx === activeIdx ? ' cmdk-active' : ''}" data-idx="${idx}">
          <div class="cmdk-ico">${icon(p.icon)}</div>
          <div class="cmdk-item-text">
            <div class="cmdk-item-label">${highlight(p.label, q)}</div>
            <div class="cmdk-item-sub">${highlight(p.sub, q)}</div>
          </div>
          ${idx === activeIdx ? '<kbd class="cmdk-item-kbd">↵</kbd>' : ''}
        </div>`;
      });
    }

    if (actions.length) {
      html += '<div class="cmdk-group-label">Actions rapides</div>';
      actions.forEach(a => {
        const idx = currentItems.length;
        currentItems.push({ type: 'action', item: a });
        html += `<div class="cmdk-item${idx === activeIdx ? ' cmdk-active' : ''}" data-idx="${idx}">
          <div class="cmdk-ico">${icon(a.icon)}</div>
          <div class="cmdk-item-text">
            <div class="cmdk-item-label">${highlight(a.label, q)}</div>
            <div class="cmdk-item-sub">${highlight(a.sub, q)}</div>
          </div>
          ${idx === activeIdx ? '<kbd class="cmdk-item-kbd">↵</kbd>' : ''}
        </div>`;
      });
    }

    results.innerHTML = html;

    results.querySelectorAll('.cmdk-item').forEach(el => {
      el.addEventListener('click', () => {
        activeIdx = parseInt(el.dataset.idx, 10);
        activate();
      });
      el.addEventListener('mouseenter', () => {
        activeIdx = parseInt(el.dataset.idx, 10);
        updateActive();
      });
    });
  }

  function updateActive() {
    document.querySelectorAll('#cefcCmdkResults .cmdk-item').forEach((el, i) => {
      el.classList.toggle('cmdk-active', i === activeIdx);
      const kbd = el.querySelector('.cmdk-item-kbd');
      if (i === activeIdx && !kbd) {
        el.insertAdjacentHTML('beforeend', '<kbd class="cmdk-item-kbd">↵</kbd>');
      } else if (i !== activeIdx && kbd) {
        kbd.remove();
      }
    });
    const active = document.querySelector('#cefcCmdkResults .cmdk-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function activate() {
    const entry = currentItems[activeIdx];
    if (!entry) return;
    if (entry.type === 'page') {
      window.location.href = entry.item.url;
    } else {
      entry.item.action();
    }
    close();
  }

  function open() {
    if (!overlay) overlay = buildHTML();
    input = document.getElementById('cefcCmdkInput');
    overlay.classList.remove('cmdk-hidden');
    activeIdx = 0;
    input.value = '';
    render('');
    setTimeout(() => input.focus(), 30);
    document.body.style.overflow = 'hidden';

    document.getElementById('cefcCmdkBackdrop').onclick = close;
    input.oninput = () => { activeIdx = 0; render(input.value.trim()); };
  }

  function close() {
    if (overlay) overlay.classList.add('cmdk-hidden');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (!overlay || overlay.classList.contains('cmdk-hidden')) open();
      else close();
      return;
    }
    if (!overlay || overlay.classList.contains('cmdk-hidden')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, currentItems.length - 1);
      updateActive();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      updateActive();
    }
    if (e.key === 'Enter') { e.preventDefault(); activate(); }
  });

  window.cefcCmdk = { open, close };
})();
