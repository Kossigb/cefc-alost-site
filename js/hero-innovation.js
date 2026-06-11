/* ===== HERO INNOVATION : Particle Constellation · Service Countdown · Scripture Typewriter ===== */
(function () {
  'use strict';

  // ─── 1. PARTICLE CONSTELLATION ───────────────────────────────
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const mouse = { x: -1e4, y: -1e4 };
    const MAX_D = 140;

    function resize() {
      const hero = canvas.parentElement;
      canvas.width  = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function spawn() {
      particles = [];
      const n = Math.min(90, Math.max(28, Math.floor(canvas.width * canvas.height / 12000)));
      for (let i = 0; i < n; i++) {
        particles.push({
          x:  Math.random() * canvas.width,
          y:  Math.random() * canvas.height,
          vx: (Math.random() - .5) * .28,
          vy: (Math.random() - .5) * .28,
          r:  Math.random() * 1.3 + .4,
          a:  Math.random() * .42 + .14,
        });
      }
    }

    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReduced) {
      function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const mx = mouse.x, my = mouse.y;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Gentle mouse repulsion
          const dx = p.x - mx, dy = p.y - my, md = Math.hypot(dx, dy);
          if (md < 95 && md > .1) {
            const f = ((95 - md) / 95) * .055;
            p.vx += dx / md * f;
            p.vy += dy / md * f;
          }

          p.vx *= .98; p.vy *= .98;
          p.vx = Math.max(-.65, Math.min(.65, p.vx));
          p.vy = Math.max(-.65, Math.min(.65, p.vy));
          p.x  = ((p.x + p.vx) + canvas.width)  % canvas.width;
          p.y  = ((p.y + p.vy) + canvas.height) % canvas.height;

          // Constellation lines
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < MAX_D) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(227,227,235,${(1 - d / MAX_D) * .15})`;
              ctx.lineWidth = .55;
              ctx.stroke();
            }
          }

          // Particle dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = `rgba(227,227,235,${p.a})`;
          ctx.fill();
        }
        requestAnimationFrame(frame);
      }

      resize(); spawn();
      canvas.classList.add('ready');
      frame();

      const hero = canvas.parentElement;
      hero.addEventListener('mousemove', e => {
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
      }, { passive: true });
      hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1e4; }, { passive: true });
      hero.addEventListener('touchmove', e => {
        if (!e.touches[0]) return;
        const r = hero.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - r.left;
        mouse.y = e.touches[0].clientY - r.top;
      }, { passive: true });
      hero.addEventListener('touchend', () => { mouse.x = mouse.y = -1e4; }, { passive: true });

      let resizeTimer;
      addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resize(); spawn(); }, 250);
      }, { passive: true });
    }
  }

  // ─── 2. SERVICE COUNTDOWN ────────────────────────────────────
  const clock = document.getElementById('heroServiceClock');
  if (clock) {
    const SVCS = [
      { day: 0, hour: 10, endH: 12, endM: 30, key: 'sunday' },
      { day: 3, hour: 18, endH: 20, endM: 0,  key: 'wednesday' },
      { day: 5, hour: 18, endH: 20, endM: 0,  key: 'friday' },
    ];
    const STRS = {
      fr: { label: 'Prochain culte dans', live: '● En direct maintenant', d:'j', h:'h', m:'min', s:'s' },
      nl: { label: 'Volgende dienst over', live: '● Nu live',             d:'d', h:'u', m:'min', s:'s' },
      en: { label: 'Next service in',      live: '● Live now',            d:'d', h:'h', m:'min', s:'s' },
    };
    const CIRC = 125.66; // 2π × r20

    function getLang() { try { return localStorage.getItem('cefcLang') || 'fr'; } catch (_) { return 'fr'; } }
    function bxNow()   { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Brussels' })); }

    function getStatus() {
      const n = bxNow();
      const d = n.getDay(), sec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
      for (const s of SVCS) {
        if (s.day === d && sec >= s.hour * 3600 && sec < s.endH * 3600 + s.endM * 60)
          return { live: true };
      }
      let best = Infinity;
      for (const s of SVCS) {
        let diff = ((s.day - d) + 7) % 7;
        let until = diff * 86400 + s.hour * 3600 - sec;
        if (until <= 0) until += 7 * 86400;
        if (until < best) best = until;
      }
      return { live: false, secs: best };
    }

    function setRing(id, val, max) {
      const el = document.getElementById('ring-' + id);
      if (el) el.style.strokeDasharray = `${Math.min(1, val / max) * CIRC} ${CIRC}`;
    }
    function setVal(id, v)  { const el = document.getElementById('cd-' + id);  if (el) el.textContent = v; }
    function setLbl(id, t)  { const el = document.getElementById('cdl-' + id); if (el) el.textContent = t; }

    function tick() {
      const L  = STRS[getLang()] || STRS.fr;
      const st = getStatus();
      const labelEl = document.getElementById('heroClockLabel');

      if (st.live) {
        clock.classList.add('is-live');
        if (labelEl) labelEl.textContent = L.live;
        ['days','hours','mins','secs'].forEach(k => { setVal(k, '●'); setRing(k, 1, 1); });
        setLbl('days', L.d); setLbl('hours', L.h); setLbl('mins', L.m); setLbl('secs', L.s);
      } else {
        clock.classList.remove('is-live');
        if (labelEl) labelEl.textContent = L.label;
        const total = st.secs;
        const days  = Math.floor(total / 86400);
        const hours = Math.floor((total % 86400) / 3600);
        const mins  = Math.floor((total % 3600) / 60);
        const secs  = total % 60;

        setVal('days',  days);                             setRing('days',  days,  7);
        setVal('hours', String(hours).padStart(2, '0'));   setRing('hours', hours, 24);
        setVal('mins',  String(mins).padStart(2, '0'));    setRing('mins',  mins,  60);
        setVal('secs',  String(secs).padStart(2, '0'));    setRing('secs',  secs,  60);
        setLbl('days', L.d); setLbl('hours', L.h); setLbl('mins', L.m); setLbl('secs', L.s);
      }
    }

    tick();
    setInterval(tick, 1000);

    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.addEventListener('click', () => setTimeout(tick, 60))
    );
  }

  // ─── 3. SCRIPTURE TYPEWRITER ─────────────────────────────────
  const verseEl = document.getElementById('heroVerse');
  if (verseEl) {
    const VERSES = {
      fr: [
        '« Je suis le chemin, la vérité et la vie. » — Jean 14:6',
        '« L\'amour ne périt jamais. » — 1 Corinthiens 13:8',
        '« Cherchez d\'abord le royaume de Dieu. » — Matthieu 6:33',
      ],
      nl: [
        '« Ik ben de weg, de waarheid en het leven. » — Johannes 14:6',
        '« De liefde vergaat nooit. » — 1 Korintiërs 13:8',
        '« Zoek eerst het Koninkrijk van God. » — Mattheüs 6:33',
      ],
      en: [
        '« I am the way, the truth, and the life. » — John 14:6',
        '« Love never fails. » — 1 Corinthians 13:8',
        '« Seek first the Kingdom of God. » — Matthew 6:33',
      ],
    };

    function getLang() { try { return localStorage.getItem('cefcLang') || 'fr'; } catch (_) { return 'fr'; } }

    const textNode = document.createTextNode('');
    const cursor   = document.createElement('span');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    verseEl.appendChild(textNode);
    verseEl.appendChild(cursor);

    let gen = 0, idx = 0, ci = 0, typing = true, pausing = false, pauseLeft = 0;

    function getVerse() {
      const vs = VERSES[getLang()] || VERSES.fr;
      return vs[idx % vs.length];
    }

    function step(g) {
      if (g !== gen) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        textNode.textContent = getVerse();
        return;
      }

      if (pausing) {
        pauseLeft--;
        if (pauseLeft <= 0) { pausing = false; }
        setTimeout(() => step(g), 50);
        return;
      }

      const verse = getVerse();

      if (typing) {
        if (ci < verse.length) {
          textNode.textContent = verse.slice(0, ++ci);
          setTimeout(() => step(g), 28 + Math.random() * 35);
        } else {
          pausing = true; pauseLeft = 75; typing = false;
          setTimeout(() => step(g), 50);
        }
      } else {
        if (ci > 0) {
          textNode.textContent = verse.slice(0, --ci);
          setTimeout(() => step(g), 13);
        } else {
          idx++; typing = true;
          setTimeout(() => step(g), 450);
        }
      }
    }

    function reset() {
      gen++; ci = 0; typing = true; pausing = false; pauseLeft = 0;
      textNode.textContent = '';
      const g = gen;
      setTimeout(() => step(g), 80);
    }

    setTimeout(() => step(gen), 3200);

    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.addEventListener('click', () => setTimeout(reset, 80))
    );
  }
})();
