// Plan d'accès 3D (page Services) : MapLibre (hébergé sur le site) + fond OpenFreeMap.
// Chargé seulement quand le plan approche de l'écran. Si la 3D n'est pas disponible,
// le plan dessiné (img/carte-alost.svg) reste affiché.
(function () {
  'use strict';
  const box = document.querySelector('.map-canvas');
  if (!box || !('IntersectionObserver' in window)) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CHURCH = [4.05393, 50.96114];
  const STATION = [4.03912, 50.94269];
  // Trajet routier gare → église (OSRM / OpenStreetMap)
  const ROUTE = [[4.03869, 50.94276], [4.03843, 50.94254], [4.03873, 50.94239], [4.03662, 50.94115], [4.03621, 50.94169], [4.03609, 50.94174], [4.03599, 50.94168], [4.03551, 50.94155], [4.03523, 50.94197], [4.03517, 50.9421], [4.03508, 50.94235], [4.03503, 50.9426], [4.03521, 50.94272], [4.03699, 50.94417], [4.03716, 50.94427], [4.03862, 50.94549], [4.03932, 50.94574], [4.03904, 50.94595], [4.03746, 50.94772], [4.03741, 50.94783], [4.03722, 50.94857], [4.03726, 50.94904], [4.0373, 50.94918], [4.03736, 50.94927], [4.0374, 50.94957], [4.03745, 50.94963], [4.03759, 50.9497], [4.03761, 50.94987], [4.03765, 50.94998], [4.03775, 50.95], [4.03796, 50.94999], [4.04039, 50.95006], [4.04051, 50.95003], [4.04099, 50.9501], [4.04106, 50.95015], [4.04155, 50.95162], [4.04175, 50.9517], [4.04164, 50.95197], [4.04165, 50.95209], [4.04193, 50.9527], [4.04203, 50.95305], [4.04208, 50.95337], [4.04226, 50.95347], [4.04361, 50.95384], [4.04447, 50.95405], [4.04467, 50.95412], [4.04485, 50.95422], [4.04506, 50.9544], [4.04568, 50.95527], [4.04603, 50.95559], [4.04634, 50.95579], [4.04813, 50.95663], [4.04997, 50.95726], [4.0505, 50.9575], [4.05108, 50.95785], [4.05327, 50.95947], [4.0544, 50.95987], [4.05478, 50.96005], [4.05573, 50.96065], [4.05592, 50.96069], [4.05599, 50.96062], [4.05614, 50.96059], [4.05628, 50.96062], [4.05633, 50.96065], [4.05637, 50.96075], [4.05631, 50.96083], [4.05618, 50.96088], [4.05598, 50.96084], [4.05513, 50.96149], [4.05483, 50.96162], [4.05431, 50.96175]];

  function hasWebGL() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
    catch (e) { return false; }
  }

  function addCss() {
    if (document.querySelector('link[href="/vendor/maplibre/maplibre-gl.css"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/vendor/maplibre/maplibre-gl.css';
    document.head.appendChild(l);
  }

  function marker(html, cls) {
    const el = document.createElement('div');
    el.className = cls; el.innerHTML = html;
    return el;
  }

  async function start() {
    if (!hasWebGL()) return;
    addCss();
    let maplibregl;
    try { maplibregl = await import('/vendor/maplibre/maplibre-gl.mjs'); } catch (e) { return; }

    const holder = document.createElement('div');
    holder.className = 'map-gl';
    box.appendChild(holder);

    const map = new maplibregl.Map({
      container: holder,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      bounds: [[4.034, 50.9405], [4.059, 50.9635]],
      fitBoundsOptions: { padding: 40 },
      cooperativeGestures: true,
      attributionControl: { compact: true },
      dragRotate: true,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'Ctrl + molette pour zoomer sur la carte',
        'CooperativeGesturesHandler.MacHelpText': '⌘ + molette pour zoomer sur la carte',
        'CooperativeGesturesHandler.MobileHelpText': 'Utilisez deux doigts pour déplacer la carte',
        'NavigationControl.ZoomIn': 'Zoomer', 'NavigationControl.ZoomOut': 'Dézoomer',
        'NavigationControl.ResetBearing': 'Remettre le nord en haut',
      },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('error', () => {});
    map.once('load', () => {
      // Teintes plus proches du site
      const tint = (id, prop, val) => { if (map.getLayer(id)) map.setPaintProperty(id, prop, val); };
      tint('building-3d', 'fill-extrusion-color', ['interpolate', ['linear'], ['zoom'], 15, '#e4e0ef', 17, '#d8d2ea']);
      tint('building-3d', 'fill-extrusion-opacity', 0.85);
      tint('water', 'fill-color', '#a8c8e8');

      map.addSource('trajet', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: still ? ROUTE : ROUTE.slice(0, 2) } } });
      map.addLayer({ id: 'trajet-bord', type: 'line', source: 'trajet', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 7, 17, 14] } });
      map.addLayer({ id: 'trajet', type: 'line', source: 'trajet', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#5b3fd6', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 4, 17, 8] } });

      new maplibregl.Marker({ element: marker('<span class="pin-station-dot"></span><span>Gare d\'Alost</span>', 'pin-station'), anchor: 'left', offset: [-9, 0] })
        .setLngLat(STATION).addTo(map);
      new maplibregl.Marker({ element: marker('<img src="/cefc-logo.png" alt=""><span><b>CEFC</b>Wijngaardveld 29</span>', 'pin-church'), anchor: 'bottom' })
        .setLngLat(CHURCH).addTo(map);

      box.classList.add('gl-ready');
      // crédits repliés en bouton « i » (ils sont aussi écrits sous la carte)
      const attrib = holder.querySelector('.maplibregl-ctrl-attrib');
      if (attrib) attrib.classList.remove('maplibregl-compact-show');
      if (still) { map.jumpTo({ center: CHURCH, zoom: 16, pitch: 45, bearing: -20 }); return; }

      // 1) le trajet se trace, 2) la caméra rejoint l'église en 3D, 3) lente rotation jusqu'au premier geste
      const src = map.getSource('trajet');
      const t0 = performance.now(), D = 2600;
      (function draw(now) {
        const k = Math.min(1, (now - t0) / D);
        const n = Math.max(2, Math.round(ROUTE.length * (1 - Math.pow(1 - k, 2))));
        src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: ROUTE.slice(0, n) } });
        if (k < 1) requestAnimationFrame(draw);
        else map.flyTo({ center: CHURCH, zoom: 16.4, pitch: 58, bearing: -28, duration: 4200, essential: true });
      })(t0);

      let spinning = true;
      const stop = () => { spinning = false; };
      ['mousedown', 'touchstart', 'wheel', 'dragstart'].forEach(ev => map.on(ev, stop));
      map.on('moveend', function spin() {
        if (!spinning || map.getPitch() < 50) return;
        map.easeTo({ bearing: map.getBearing() + 25, duration: 9000, easing: x => x, essential: true });
      });
    });
  }

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    start();
  }, { rootMargin: '250px' });
  io.observe(box);
})();
