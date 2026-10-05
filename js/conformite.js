// ===== CONFORMITÉ : consentement cookies (RGPD / ePrivacy) + accessibilité =====
// - Le site lui-même ne dépose aucun cookie publicitaire ni de mesure d'audience.
// - Les contenus externes (vidéos YouTube) déposent des cookies : ils ne sont
//   chargés qu'après accord explicite. Refuser est aussi simple qu'accepter.
// - Le choix est conservé 6 mois dans le navigateur (localStorage), puis redemandé.
(function () {
  'use strict';

  var KEY = 'cefcConsent';
  var VERSION = 1;
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182; // ~6 mois

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (!c || c.v !== VERSION || Date.now() - c.date > MAX_AGE) return null;
      return c;
    } catch (e) { return null; }
  }
  function write(media) {
    var c = { v: VERSION, media: !!media, date: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }
  function mediaAllowed() {
    var c = read();
    return !!(c && c.media);
  }

  // ---------- Contenus externes bloqués tant que non acceptés ----------
  function providerOf(url) {
    if (/youtube/.test(url)) return { name: 'YouTube (Google)', open: url.replace('/embed/', '/watch?v=').replace('watch?v=live_stream?channel=', 'channel/') };
    if (/google\.[a-z.]+\/maps|maps\.google/.test(url)) return { name: 'Google Maps', open: 'https://maps.google.com/?q=Wijngaardveld+29,+9300+Aalst' };
    return { name: 'un service externe', open: url };
  }

  function placeholderFor(iframe) {
    var parent = iframe.parentElement;
    if (!parent) return null;
    var ph = parent.querySelector(':scope > .cc-placeholder');
    if (ph) return ph;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    if (!parent.style.minHeight && parent.offsetHeight < 120) parent.style.minHeight = '240px';
    var p = providerOf(iframe.getAttribute('data-consent-src') || '');
    ph = document.createElement('div');
    ph.className = 'cc-placeholder';
    ph.innerHTML =
      '<p>Ce contenu est fourni par <strong>' + p.name + '</strong>, qui peut déposer des cookies. ' +
      'Il ne s\'affiche qu\'avec votre accord.</p>' +
      '<button type="button">Afficher ce contenu</button>' +
      '<a href="' + p.open + '" target="_blank" rel="noopener">Ouvrir directement sur ' + p.name.replace(/ \(.*\)/, '') + '</a>';
    ph.querySelector('button').addEventListener('click', function () {
      write(true);
      apply();
      var b = document.getElementById('ccBanner');
      if (b) b.hidden = true;
    });
    parent.appendChild(ph);
    return ph;
  }

  function apply() {
    var ok = mediaAllowed();
    document.querySelectorAll('iframe[data-consent-src]').forEach(function (f) {
      var url = f.getAttribute('data-consent-src');
      var ph = f.parentElement && f.parentElement.querySelector(':scope > .cc-placeholder');
      if (ok) {
        if (f.getAttribute('src') !== url) f.setAttribute('src', url);
        if (ph) ph.remove();
      } else {
        if (f.getAttribute('src')) f.removeAttribute('src');
        placeholderFor(f);
      }
    });
  }

  // Utilisé par main.js pour la vidéo du direct
  function embed(iframe, url) {
    if (!iframe) return;
    if (!url) {
      iframe.removeAttribute('data-consent-src');
      iframe.removeAttribute('src');
      var ph = iframe.parentElement && iframe.parentElement.querySelector(':scope > .cc-placeholder');
      if (ph) ph.remove();
      return;
    }
    if (iframe.getAttribute('data-consent-src') === url && (iframe.getAttribute('src') === url || !mediaAllowed())) return;
    iframe.setAttribute('data-consent-src', url);
    apply();
  }

  // ---------- Bannière ----------
  function buildBanner() {
    var el = document.createElement('section');
    el.id = 'ccBanner';
    el.className = 'cc-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', 'ccTitle');
    el.setAttribute('aria-describedby', 'ccDesc');
    el.hidden = true;
    el.innerHTML =
      '<h2 id="ccTitle">Vos choix de confidentialité</h2>' +
      '<p id="ccDesc">Ce site n\'utilise ni publicité ni outil de statistiques. ' +
      'Seules les vidéos YouTube intégrées peuvent déposer des cookies : ' +
      'ils ne se chargent que si vous les acceptez. Vous pouvez changer d\'avis à tout moment via « Gérer les cookies » en bas de page. ' +
      '<a href="/cookies.html">En savoir plus</a></p>' +
      '<div class="cc-options" id="ccOptions" hidden>' +
      '  <label class="cc-opt"><input type="checkbox" checked disabled />' +
      '    <span><strong>Nécessaires</strong><small>Mémorisent votre langue et vos choix ci-dessus. Aucun suivi. Toujours actifs.</small></span></label>' +
      '  <label class="cc-opt"><input type="checkbox" id="ccMedia" />' +
      '    <span><strong>Contenus externes</strong><small>Vidéos YouTube (culte en direct). Google peut déposer des cookies et recevoir votre adresse IP.</small></span></label>' +
      '</div>' +
      '<div class="cc-actions">' +
      '  <button type="button" class="cc-btn" data-cc="refuse">Tout refuser</button>' +
      '  <button type="button" class="cc-btn" data-cc="accept">Tout accepter</button>' +
      '  <button type="button" class="cc-btn cc-link" data-cc="custom">Personnaliser</button>' +
      '</div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (!b) return;
      var act = b.getAttribute('data-cc');
      if (act === 'accept') { write(true); close(); }
      else if (act === 'refuse') { write(false); close(); }
      else if (act === 'custom') {
        var opts = el.querySelector('#ccOptions');
        if (opts.hidden) {
          opts.hidden = false;
          el.querySelector('#ccMedia').checked = mediaAllowed();
          b.textContent = 'Enregistrer mes choix';
          el.querySelector('#ccMedia').focus();
        } else {
          write(el.querySelector('#ccMedia').checked);
          close();
        }
      }
    });
    el.addEventListener('keydown', function (e) {
      // Échap = on ferme sans rien accepter (équivaut à refuser si aucun choix encore)
      if (e.key === 'Escape') { if (!read()) write(false); close(); }
    });
    return el;
  }

  var lastFocus = null;
  function open() {
    var el = document.getElementById('ccBanner') || buildBanner();
    var opts = el.querySelector('#ccOptions');
    var custom = el.querySelector('[data-cc="custom"]');
    opts.hidden = true;
    custom.textContent = 'Personnaliser';
    lastFocus = document.activeElement;
    el.hidden = false;
    el.querySelector('[data-cc="refuse"]').focus({ preventScroll: true });
  }
  function close() {
    var el = document.getElementById('ccBanner');
    if (el) el.hidden = true;
    apply();
    if (lastFocus && lastFocus.focus && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
  }

  // ---------- Accessibilité ----------
  function addSkipLink() {
    if (document.querySelector('.skip-link')) return;
    var nav = document.getElementById('nav') || document.querySelector('nav');
    var target = document.querySelector('main') || (nav && nav.nextElementSibling);
    while (target && (target.tagName === 'SCRIPT' || target.hidden)) target = target.nextElementSibling;
    if (!target) return;
    if (!target.id) target.id = 'contenu';
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    var a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#' + target.id;
    a.textContent = 'Aller au contenu principal';
    document.body.insertBefore(a, document.body.firstChild);
  }

  function wireFooterButtons() {
    document.querySelectorAll('[data-cc-open]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
  }

  window.cefcConsent = { open: open, apply: apply, embed: embed, mediaAllowed: mediaAllowed };

  function init() {
    addSkipLink();
    wireFooterButtons();
    apply();
    if (!read()) open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
