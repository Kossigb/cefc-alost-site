// Animation d'entrée : le logo se dessine, puis rejoint sa place dans le menu.
// Une seule fois par visite (sessionStorage), passable d'un clic ou d'une touche,
// jamais jouée si l'appareil demande moins d'animations.
// Script chargé juste après <body>, sans defer : l'écran d'accueil est en place
// avant que le reste de la page ne s'affiche.
(function () {
  'use strict';
  var root = document.documentElement;
  try {
    if (sessionStorage.getItem('cefcIntro')) return;
    sessionStorage.setItem('cefcIntro', '1');
  } catch (e) { return; }
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Sans @property (vieux navigateurs), le dessin circulaire est remplacé par un fondu
  if (!(window.CSS && CSS.registerProperty)) root.classList.add('intro-simple');
  root.classList.add('intro-playing');

  var name1 = 'Centre Évangélique', name2 = 'La Famille Chrétienne';
  var split = function (txt, from) {
    return txt.split('').map(function (c, i) {
      return '<span style="--i:' + (from + i) + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>';
    }).join('');
  };
  var el = document.createElement('div');
  el.id = 'introLogo';
  el.className = 'intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="intro-bg"></div>' +
    '<div class="intro-stage">' +
    '  <div class="intro-glow"></div>' +
    '  <svg class="intro-ring" viewBox="0 0 200 200"><defs><linearGradient id="introG" x1="0" y1="0" x2="1" y2="1">' +
    '    <stop offset="0" stop-color="#C4B5FD"/><stop offset=".5" stop-color="#7C5CF6"/><stop offset="1" stop-color="#E3E3EB"/></linearGradient></defs>' +
    '    <circle cx="100" cy="100" r="96"/></svg>' +
    '  <div class="intro-mark"><img src="/cefc-logo.png" alt=""></div>' +
    '</div>' +
    '<div class="intro-name"><div>' + split(name1, 0) + '</div><em>' + split(name2, 6) + '</em></div>';
  document.body.insertBefore(el, document.body.firstChild);

  var stage = el.querySelector('.intro-stage');
  var done = false, timer;

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    var target = document.querySelector('.nav-brand-mark');
    var r = target && target.getBoundingClientRect();
    var s = stage.getBoundingClientRect();
    el.classList.add('intro-out');
    if (r && r.width && stage.animate) {
      var dx = (r.left + r.width / 2) - (s.left + s.width / 2);
      var dy = (r.top + r.height / 2) - (s.top + s.height / 2);
      var k = r.width / s.width;
      stage.animate(
        [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')' }],
        { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }
      );
    }
    setTimeout(function () {
      root.classList.remove('intro-playing');
      document.dispatchEvent(new CustomEvent('cefc:intro-done'));
    }, 450);
    setTimeout(function () { el.remove(); }, 820);
  }

  timer = setTimeout(finish, 1900);
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, finish, { once: true, passive: true });
  });
})();
