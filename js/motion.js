// Animations d'interface : barre de progression, nav qui se cache au scroll,
// apparitions en cascade, léger parallaxe du hero, compteurs.
// Rien ne bouge si l'appareil demande moins d'animations.
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  root.classList.add('motion-ok');

  // Barre de progression de lecture
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  // La nav se replie quand on descend, revient dès qu'on remonte
  const nav = document.getElementById('nav');
  const navLinks = document.getElementById('navLinks');
  let lastY = scrollY, ticking = false;

  // Parallaxe discret sur le contenu du hero (accueil)
  // Sur écran tactile : pas de parallaxe ni de menu escamotable (le défilement par
  // élan et la barre d'adresse mobile les font trembler / clignoter).
  const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const heroInner = touch ? null : document.querySelector('.hero-inner');
  const hero = heroInner && heroInner.closest('.hero');

  function onScroll() {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;

    if (nav && !touch) {
      const menuOpen = navLinks && navLinks.classList.contains('open');
      if (y > 420 && y > lastY + 4 && !menuOpen && !nav.contains(document.activeElement)) nav.classList.add('nav-hidden');
      else if (y < lastY - 4 || y < 420) nav.classList.remove('nav-hidden');
    }
    lastY = y;

    if (hero) {
      const h = hero.offsetHeight;
      if (y < h) {
        const p = y / h;
        heroInner.style.transform = `translate3d(0, ${p * 90}px, 0)`;
        heroInner.style.opacity = String(1 - p * 1.1);
      }
    }
    ticking = false;
  }
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Cascade : les éléments .reveal d'une même grille arrivent l'un après l'autre
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.style.transitionDelay) return;
    const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    if (siblings.length < 2) return;
    const i = siblings.indexOf(el);
    el.style.transitionDelay = Math.min(i * 80, 480) + 'ms';
  });

  // Les éléments ajoutés par le JS après coup (annonces, galerie…) : même traitement
  // On observe un élément « témoin » : pour les titres, c'est leur parent,
  // car le rideau (clip-path) rend le titre lui-même invisible pour l'observer.
  const watched = new Map();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      (watched.get(e.target) || []).forEach(t => t.classList.add('in-view'));
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  function watch(target, witness) {
    if (!watched.has(witness)) { watched.set(witness, []); io.observe(witness); }
    watched.get(witness).push(target);
  }
  document.querySelectorAll('.section-title').forEach(el => watch(el, el.parentElement || el));
  document.querySelectorAll('.section-head, .dept-card, .gallery-wrap, .temple-stat-val, .legal-wrap h2')
    .forEach(el => watch(el, el));

  // Compteurs : « 20 € », « 1er »… montent depuis 0 quand ils apparaissent
  document.querySelectorAll('.temple-stat-val').forEach(el => {
    const first = el.firstChild;
    if (!first || first.nodeType !== 3) return;
    const m = first.nodeValue.match(/^(\d+)(\D*)$/);
    if (!m || /\//.test(el.textContent)) return;
    const target = +m[1], suffix = m[2];
    first.nodeValue = '0' + suffix;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now(), dur = 1100;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        first.nodeValue = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  // Boutons principaux : léger effet « aimanté » à la souris (pas au tactile)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.btn-primary, .btn-ghost, .form-submit, .btn-youtube').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.translate = `${x * 6}px ${y * 5}px`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
    });
  }
})();
