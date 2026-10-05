// Fond de l'accueil : diaporama des photos du culte (galerie de l'admin),
// fondus enchaînés + lent mouvement de caméra. Une seule photo fixe si
// l'appareil demande moins d'animations. Seules la photo affichée et la
// suivante sont chargées.
(function () {
  'use strict';
  const box = document.querySelector('.hero-slides');
  if (!box) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 6500;          // durée d'affichage d'une photo (ms)
  const FADE = 1800;          // durée du fondu (doit suivre le CSS)
  let list = [], i = 0, timer = null, visible = true;

  const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const load = url => new Promise(res => { const im = new Image(); im.onload = im.onerror = () => res(im); im.src = url; });
  const rnd = (a, b) => (a + Math.random() * (b - a)).toFixed(1) + '%';

  async function show(url) {
    const im = await load(url);
    if (!im.naturalWidth) return false;
    const s = document.createElement('div');
    s.className = 'hero-slide';
    // Photo trop différente de l'écran (ex. photo en hauteur sur un écran large) :
    // on l'affiche entière, sur un fond flou de la même photo, au lieu de la recadrer.
    const photoRatio = im.naturalWidth / im.naturalHeight;
    const boxRatio = box.clientWidth / Math.max(1, box.clientHeight);
    const fit = Math.max(photoRatio, boxRatio) / Math.min(photoRatio, boxRatio) > 1.35 ? 'contain' : 'cover';
    s.classList.add('fit-' + fit);
    s.innerHTML = `<div class="hero-slide-blur"></div><div class="hero-slide-img"></div>`;
    s.querySelectorAll('div').forEach(d => { d.style.backgroundImage = `url("${url}")`; });
    // direction du mouvement de caméra, différente à chaque photo
    s.style.setProperty('--x0', rnd(-1, 1)); s.style.setProperty('--y0', rnd(-1, 1));
    s.style.setProperty('--x1', rnd(-1.5, 1.5)); s.style.setProperty('--y1', rnd(-1.5, 1.5));
    box.appendChild(s);
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('on')));
    // on retire les anciennes photos une fois le fondu terminé
    setTimeout(() => { while (box.children.length > 2) box.firstElementChild.remove(); }, FADE + 100);
    return true;
  }

  async function next() {
    if (!list.length) return;
    let tries = 0;
    while (tries++ < list.length && !(await show(list[i++ % list.length]))) { /* photo illisible : suivante */ }
    load(list[i % list.length]); // précharge la suivante
    if (!still) schedule();
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { if (visible && !document.hidden) next(); else schedule(); }, HOLD); }

  // pause quand l'accueil n'est plus à l'écran ou que l'onglet est caché
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);

  fetch('/photos_culte.json')
    .then(r => r.json())
    .then(d => {
      list = shuffle((d.photos || []).map(p => p && p.url).filter(Boolean));
      if (still) list = list.slice(0, 1);
      if (list.length) { box.classList.add('has-photos'); next(); }
    })
    .catch(() => {});
})();
