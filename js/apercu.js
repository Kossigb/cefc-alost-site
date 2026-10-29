// Aperçu depuis l'admin : le site s'affiche avec le contenu pas encore publié.
// - dans le cadre d'aperçu de l'admin : les données viennent de window.parent.cefcPreviewData()
// - dans un onglet séparé (?apercu=1) : elles viennent de localStorage, et l'onglet
//   reste en aperçu quand on change de page.
// Chargé tout en haut de chaque page, avant les scripts qui lisent contenu.json.
(function () {
  'use strict';
  var data = null, framed = false;
  try {
    if (window.parent !== window && typeof window.parent.cefcPreviewData === 'function') {
      data = window.parent.cefcPreviewData();
      framed = true;
    }
  } catch (e) { /* cadre d'un autre site : pas d'aperçu */ }

  if (!data) {
    try {
      if (/[?&](apercu|preview)=1/.test(location.search)) sessionStorage.setItem('cefcApercu', '1');
      if (sessionStorage.getItem('cefcApercu')) data = JSON.parse(localStorage.getItem('cefc_preview') || 'null');
    } catch (e) { data = null; }
  }
  if (!data || typeof data.contenu !== 'string') return;

  window.CEFC_PREVIEW = data;
  try { sessionStorage.setItem('cefcIntro', '1'); } catch (e) {} // pas d'animation d'entrée en aperçu
  document.documentElement.classList.add('cefc-apercu');

  // contenu.json et photos_culte.json : version de l'admin au lieu de la version en ligne
  var files = { 'contenu.json': data.contenu, 'photos_culte.json': data.photos };
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var name = url.split('?')[0].split('/').pop();
    if (files[name]) {
      return Promise.resolve(new Response(files[name], { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return realFetch(input, init);
  };

  var style = document.createElement('style');
  style.textContent = '.cefc-apercu .cc-banner{display:none!important}' +
    '.apercu-badge{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;' +
    'background:#7c3aed;color:#fff;padding:9px 16px;border-radius:10px;font:600 13px/1.3 system-ui,sans-serif;' +
    'box-shadow:0 8px 28px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center;white-space:nowrap}' +
    '.apercu-badge button{background:rgba(255,255,255,.2);border:0;color:#fff;border-radius:6px;padding:3px 9px;cursor:pointer;font:inherit}';
  document.head.appendChild(style);

  // En onglet séparé, un rappel discret (dans l'admin, la barre d'outils suffit)
  if (!framed) {
    document.addEventListener('DOMContentLoaded', function () {
      var b = document.createElement('div');
      b.className = 'apercu-badge';
      b.innerHTML = 'Aperçu : modifications pas encore publiées <button type="button">Quitter</button>';
      b.querySelector('button').onclick = function () {
        try { sessionStorage.removeItem('cefcApercu'); } catch (e) {}
        location.href = location.pathname;
      };
      document.body.appendChild(b);
    });
  }
})();
