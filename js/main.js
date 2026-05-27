// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
const isInnerPage = window.location.pathname !== '/' && window.location.pathname !== '/index.html';
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) nav.classList.add('scrolled');
  else if (!isInnerPage) nav.classList.remove('scrolled');
}, { passive: true });
if (isInnerPage) nav.classList.add('scrolled');

// ===== MOBILE MENU =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', false);
  });
});

// ===== REVEAL ON SCROLL =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== ANIMATION LOGO JEFC =====
const jefcWrap = document.querySelector('.jefc-display-wrap');
const jefcDisplay = document.getElementById('jefcDisplay');
if (jefcWrap && jefcDisplay) {
  const jefcIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        jefcDisplay.classList.add('in');
        jefcWrap.classList.add('in');
        jefcIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  jefcIO.observe(jefcWrap);
}

// ===== LIVE STATUS (heure de Bruxelles) =====
const SERVICES = [
  { day: 0, hour: 10, endHour: 12, endMin: 30, key: 'sunday' },
  { day: 3, hour: 18, endHour: 20, endMin: 0,  key: 'wednesday' },
  { day: 5, hour: 18, endHour: 20, endMin: 0,  key: 'friday' },
];
const LIVE_STRINGS = {
  fr: {
    liveNow: 'En direct maintenant',
    liveTitle: 'Le culte est en direct',
    liveSub: 'Rejoignez-nous dès maintenant — le culte est diffusé sur notre chaîne.',
    liveCta: 'Regarder le live',
    offlineTitle: 'Suivez nos cultes en direct',
    offlineSub: 'Cultes chaque dimanche à 10h, mercredi et vendredi à 18h.',
    offlineCta: 'Voir sur YouTube',
    next: (d, h, m, key) => {
      const names = { sunday:'Dimanche', wednesday:'Mercredi', friday:'Vendredi' };
      const t = d > 0 ? `${d} jour${d>1?'s':''} et ${h}h` : h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`;
      return `Prochain culte (${names[key]}) dans ${t}`;
    }
  },
  nl: {
    liveNow: 'Nu live',
    liveTitle: 'De dienst is live',
    liveSub: 'Sluit u nu bij ons aan — de dienst is live op ons kanaal.',
    liveCta: 'Bekijk live',
    offlineTitle: 'Volg onze diensten live',
    offlineSub: 'Diensten elke zondag om 10u, woensdag en vrijdag om 18u.',
    offlineCta: 'Bekijk op YouTube',
    next: (d, h, m, key) => {
      const names = { sunday:'Zondag', wednesday:'Woensdag', friday:'Vrijdag' };
      const t = d > 0 ? `${d} dag${d>1?'en':''} en ${h}u` : h > 0 ? `${h}u${String(m).padStart(2,'0')}` : `${m} min`;
      return `Volgende dienst (${names[key]}) over ${t}`;
    }
  },
  en: {
    liveNow: 'Live now',
    liveTitle: 'The service is live',
    liveSub: 'Join us now — the service is streaming on our channel.',
    liveCta: 'Watch live',
    offlineTitle: 'Watch our services live',
    offlineSub: 'Services every Sunday at 10am, Wednesday and Friday at 6pm.',
    offlineCta: 'Watch on YouTube',
    next: (d, h, m, key) => {
      const names = { sunday:'Sunday', wednesday:'Wednesday', friday:'Friday' };
      const t = d > 0 ? `${d} day${d>1?'s':''} and ${h}h` : h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`;
      return `Next service (${names[key]}) in ${t}`;
    }
  }
};

function youtubeEmbedUrl(url) {
  if (!url) return '';
  const origin = encodeURIComponent(location.origin);
  const params = `autoplay=1&mute=1&rel=0&origin=${origin}`;
  const m = url.match(/[?&]v=([^&]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?${params}`;
  const s = url.match(/youtu\.be\/([^?&#]+)/);
  if (s) return `https://www.youtube.com/embed/${s[1]}?${params}`;
  const lv = url.match(/youtube\.com\/live\/([^?&#]+)/);
  if (lv) return `https://www.youtube.com/embed/${lv[1]}?${params}`;
  if (url.includes('youtube.com/embed/')) return url;
  const ch = CMS_DATA && CMS_DATA.infos && CMS_DATA.infos.youtube_channel_id;
  if (ch) return `https://www.youtube.com/embed/live_stream?channel=${ch}&autoplay=1&origin=${origin}`;
  return '';
}

function activateLiveEmbed(embedUrl, titleText, subText, ctaLabel) {
  const badge      = document.getElementById('liveBadge');
  const badgeText  = document.getElementById('liveBadgeText');
  const title      = document.getElementById('liveTitle');
  const sub        = document.getElementById('liveSub');
  const ctaText    = document.getElementById('liveCtaText');
  const liveEmbed  = document.getElementById('liveEmbed');
  const liveIframe = document.getElementById('liveIframe');
  const liveCard   = liveEmbed && liveEmbed.closest('.live-card');
  const lang = (() => { try { return localStorage.getItem('cefcLang') || 'fr'; } catch(e) { return 'fr'; } })();
  const s = LIVE_STRINGS[lang] || LIVE_STRINGS.fr;
  if (badge) badge.classList.remove('offline');
  if (badgeText) badgeText.textContent = s.liveNow;
  if (title) title.textContent = titleText || s.liveTitle;
  if (sub) sub.textContent = subText || s.liveSub;
  if (ctaText) ctaText.textContent = ctaLabel || s.liveCta;
  const chId = CMS_DATA && CMS_DATA.infos && CMS_DATA.infos.youtube_channel_id;
  const ctaLink = ctaText && ctaText.closest('a');
  if (ctaLink && chId) ctaLink.href = `https://www.youtube.com/channel/${chId}/live`;
  if (liveIframe && !liveIframe.src) liveIframe.src = embedUrl;
  if (liveEmbed) liveEmbed.style.display = 'block';
  if (liveCard) liveCard.classList.add('live-card--on');
  const fallback = document.getElementById('liveFallback');
  const fallbackLink = document.getElementById('liveFallbackLink');
  const watchUrl = chId
    ? `https://www.youtube.com/channel/${chId}/live`
    : ((CMS_DATA && CMS_DATA.live && CMS_DATA.live.url) || embedUrl);
  if (fallbackLink) fallbackLink.href = watchUrl;
  if (fallback) fallback.style.display = 'flex';
}

function updateLiveStatus() {
  const badge      = document.getElementById('liveBadge');
  const badgeText  = document.getElementById('liveBadgeText');
  const title      = document.getElementById('liveTitle');
  const sub        = document.getElementById('liveSub');
  const ctaText    = document.getElementById('liveCtaText');
  const liveEmbed  = document.getElementById('liveEmbed');
  const liveIframe = document.getElementById('liveIframe');
  const liveCard   = liveEmbed && liveEmbed.closest('.live-card');

  const lang = (() => { try { return localStorage.getItem('cefcLang') || 'fr'; } catch(e) { return 'fr'; } })();
  const s = LIVE_STRINGS[lang] || LIVE_STRINGS.fr;

  // 1. Priorité : champ admin CMS "live"
  const cmsLive = CMS_DATA && CMS_DATA.live;
  if (cmsLive && cmsLive.actif && cmsLive.url) {
    const embedUrl = youtubeEmbedUrl(cmsLive.url);
    const liveTitle = (cmsLive['titre_' + lang] || cmsLive.titre) || s.liveTitle;
    const liveSub   = (cmsLive['sous_titre_' + lang] || cmsLive.sous_titre) || s.liveSub;
    if (embedUrl) {
      activateLiveEmbed(embedUrl, liveTitle, liveSub, s.liveCta);
      return;
    }
  }

  // 2. Secours : détection par heure (Bruxelles)
  const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Brussels' });
  const now = new Date(nowStr);
  const day = now.getDay();
  const totalMin = now.getHours() * 60 + now.getMinutes();

  const activeSvc = SERVICES.find(svc =>
    svc.day === day && totalMin >= svc.hour * 60 && totalMin < svc.endHour * 60 + svc.endMin
  );

  if (activeSvc) {
    const channelId = CMS_DATA && CMS_DATA.infos && CMS_DATA.infos.youtube_channel_id;
    if (channelId) {
      activateLiveEmbed(
        `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1`,
        s.liveTitle, s.liveSub, s.liveCta
      );
    } else {
      if (badge) badge.classList.remove('offline');
      if (badgeText) badgeText.textContent = s.liveNow;
      if (title) title.textContent = s.liveTitle;
      if (sub) sub.textContent = s.liveSub;
      if (ctaText) ctaText.textContent = s.liveCta;
    }
    return;
  }

  // 3. Hors direct : affichage du prochain culte
  if (liveEmbed) liveEmbed.style.display = 'none';
  if (liveIframe) liveIframe.src = '';
  if (liveCard) liveCard.classList.remove('live-card--on');
  let minDiff = Infinity, nextKey = 'sunday';
  for (const svc of SERVICES) {
    const nx = new Date(now);
    let du = (svc.day - day + 7) % 7;
    if (du === 0 && totalMin >= svc.endHour * 60 + svc.endMin) du = 7;
    nx.setDate(now.getDate() + du);
    nx.setHours(svc.hour, 0, 0, 0);
    const diff = nx - now;
    if (diff > 0 && diff < minDiff) { minDiff = diff; nextKey = svc.key; }
  }
  const d = Math.floor(minDiff / 86400000);
  const h = Math.floor((minDiff % 86400000) / 3600000);
  const m = Math.floor((minDiff % 3600000) / 60000);
  if (badge) badge.classList.add('offline');
  if (badgeText) badgeText.textContent = s.next(d, h, m, nextKey);
  if (title) title.textContent = s.offlineTitle;
  if (sub) sub.textContent = s.offlineSub;
  if (ctaText) ctaText.textContent = s.offlineCta;
}
// NE PAS appeler updateLiveStatus() ici — CMS_DATA n'est pas encore chargé.
// L'appel est fait après loadCmsContentSync() ci-dessous.

// ===== MOTEUR CMS — chargement de contenu.json =====
// Synchrone via XMLHttpRequest pour que tout soit en place avant le reste du JS
// (notamment avant la collecte des textes pour la traduction NL).
let CMS_DATA = null;
function loadCmsContentSync() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/contenu.json', false); // synchrone
    xhr.overrideMimeType('application/json');
    xhr.send(null);
    if (xhr.status === 200 || xhr.status === 0) {
      CMS_DATA = JSON.parse(xhr.responseText);
      return true;
    }
  } catch (e) {
    console.warn('CMS : impossible de charger contenu.json — utilisation des valeurs par défaut.', e);
  }
  return false;
}

// Récupère une valeur dans CMS_DATA par chemin "horaires.dimanche.heure"
function getCmsValue(path) {
  if (!CMS_DATA) return null;
  return path.split('.').reduce((o, k) => (o && k in o) ? o[k] : null, CMS_DATA);
}

// Détermine la langue cible AU MOMENT du remplissage.
// Si NL et qu'une variante "_nl" existe, on l'utilise ; sinon on retombe sur FR.
function pickLangValue(obj, fieldName) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const lang = (() => { try { return localStorage.getItem('cefcLang') || 'fr'; } catch(e) { return 'fr'; } })();
  const suffix = lang !== 'fr' ? '_' + lang : null;
  if (suffix && (fieldName + suffix) in obj && obj[fieldName + suffix] !== '' && obj[fieldName + suffix] != null) {
    return obj[fieldName + suffix];
  }
  return obj[fieldName];
}

function applyCmsContent() {
  if (!CMS_DATA) return;

  // 1. Champs simples : data-cms="path.to.field"
  document.querySelectorAll('[data-cms]').forEach(el => {
    const path = el.getAttribute('data-cms');
    const parts = path.split('.');
    const lastKey = parts[parts.length - 1];
    const parent = parts.slice(0, -1).join('.');
    const parentObj = parent ? getCmsValue(parent) : CMS_DATA;
    if (parentObj && typeof parentObj === 'object') {
      const v = pickLangValue(parentObj, lastKey);
      if (v !== null && v !== undefined) el.textContent = v;
    }
  });

  // 2. Listes répétées : data-cms-list="path.to.array" avec un <template> à l'intérieur
  document.querySelectorAll('[data-cms-list]').forEach(container => {
    const path = container.getAttribute('data-cms-list');
    const arr = getCmsValue(path);
    if (!Array.isArray(arr)) return;

    const tpl = container.querySelector('template[data-cms-template]');
    if (!tpl) return;

    // Vide le conteneur sauf le template
    Array.from(container.children).forEach(child => {
      if (child !== tpl) child.remove();
    });

    if (arr.length === 0) {
      container.setAttribute('data-empty', 'true');
      // Cache la section parente si elle a la classe .annonces et qu'elle est vide
      const parentSection = container.closest('section.annonces');
      if (parentSection) parentSection.classList.add('empty-section');
      return;
    }
    container.removeAttribute('data-empty');
    const parentSection = container.closest('section.annonces');
    if (parentSection) parentSection.classList.remove('empty-section');

    arr.forEach((item, i) => {
      const node = tpl.content.firstElementChild.cloneNode(true);

      // Délai d'animation décalé pour le reveal stagger
      const currentDelay = node.style.transitionDelay;
      if (!currentDelay) node.style.transitionDelay = (0.05 + i * 0.05) + 's';

      // Remplir les champs data-cms-field
      node.querySelectorAll('[data-cms-field]').forEach(f => {
        const key = f.getAttribute('data-cms-field');
        const v = pickLangValue(item, key);
        if (v !== null && v !== undefined) f.textContent = v;
      });

      // Classe conditionnelle : data-cms-feature="className" + champ booléen "principal" ou "important"
      const featClass = node.getAttribute('data-cms-feature');
      if (featClass) {
        // On regarde si l'item a un booléen "principal" ou "important" ou featClass directement
        const flag = item[featClass] === true || item.principal === true || item.important === true;
        if (flag) node.classList.add(featClass);
      }

      // Affichage conditionnel : data-cms-show-if="champ"
      node.querySelectorAll('[data-cms-show-if]').forEach(el => {
        const flag = item[el.getAttribute('data-cms-show-if')];
        if (!flag) el.style.display = 'none';
      });

      // Images : data-cms-img="champ"
      node.querySelectorAll('[data-cms-img]').forEach(img => {
        const key = img.getAttribute('data-cms-img');
        const v = item[key];
        if (v) { img.src = v; node.classList.add('has-img'); }
      });

      // Icônes : data-cms-icon (icône SVG selon le jour)
      node.querySelectorAll('[data-cms-icon]').forEach(el => {
        const day = (item.jour || '').toLowerCase();
        let svg = '';
        if (day.includes('dimanche') || day.includes('zondag')) {
          svg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
        } else if (day.includes('mercredi') || day.includes('woensdag')) {
          svg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
        } else if (day.includes('vendredi') || day.includes('vrijdag')) {
          svg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
        }
        if (svg) el.innerHTML = svg;
      });

      // Pour les départements : photo en background-image
      if (path === 'departements.liste' && item.photo) {
        const bg = node.querySelector('.dept-card-bg');
        if (bg) {
          bg.style.backgroundImage = `url('img/dept/${item.photo}')`;
          bg.classList.remove('placeholder');
        }
      }

      container.appendChild(node);
    });
  });
}

loadCmsContentSync();
applyCmsContent();

// Live status — doit être après loadCmsContentSync() pour que CMS_DATA soit disponible
updateLiveStatus();
setInterval(updateLiveStatus, 60000);

// SEO meta tags depuis CMS
(function() {
  const seo = CMS_DATA && CMS_DATA.seo;
  if (!seo) return;
  const set = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
  if (seo.meta_title) document.title = seo.meta_title;
  set('meta[name="description"]', 'content', seo.meta_description);
  set('meta[property="og:title"]', 'content', seo.og_title);
  set('meta[property="og:description"]', 'content', seo.og_description);
})();

// ===== VISION & MISSION — rendu depuis contenu.json =====
(function() {
  const vm = CMS_DATA && CMS_DATA.vision_mission;
  if (!vm) return;
  const section = document.getElementById('vision');
  if (!section) return;
  if (vm.actif === false) { section.style.display = 'none'; return; }

  const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
  setText('vm-eyebrow',       vm.eyebrow);
  setText('vm-titre-accent',  vm.titre);
  setText('vm-lead',          vm.intro);
  setText('vm-vision-titre',  vm.vision_titre);
  setText('vm-vision-texte',  vm.vision_texte);
  setText('vm-mission-titre', vm.mission_titre);
  setText('vm-mission-texte', vm.mission_texte);
  setText('vm-verset-texte',  vm.verset_texte);
  setText('vm-verset-ref',    vm.verset_reference);

  if (vm.valeurs && vm.valeurs.length) {
    const grid = document.getElementById('vm-valeurs');
    if (grid) {
      grid.innerHTML = '';
      vm.valeurs.forEach(v => {
        const d = document.createElement('div');
        d.className = 'valeur-item reveal';
        const SVG_ICONS = {
          parole: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
          priere: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 8h16"/></svg>`,
          famille: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
          evangelisation: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        };
        const iconHtml = SVG_ICONS[v.icone] || `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>`;
        d.innerHTML = `<div class="valeur-icon">${iconHtml}</div><h4>${v.titre || ''}</h4><p>${v.texte || ''}</p>`;
        grid.appendChild(d);
      });
    }
  }
})();

// Re-observer les éléments .reveal ajoutés dynamiquement par le CMS
document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));

// ===== TRADUCTION FR / NL =====
// ===== TRADUCTIONS PAR CLÉ (data-i18n) =====
// Couvre les éléments que le marcheur de nœuds texte rate parfois :
// contenus CMS sans suffixe _nl/_en, textes longs, éléments mixtes SVG+texte.
// S'applique en dernier dans applyLanguage() pour corriger les manques.
const I18N = {
  nl: {
    "nav.home": "Welkom",
    "nav.services": "Diensten",
    "nav.youth": "Jeugd",
    "nav.shuttle": "Pendeldienst",
    "nav.depts": "Afdelingen",
    "nav.contact": "Contact",
    "nav.live": "Live",
    "nav.dons": "Giften",
    "anniv.banner.title": "Viert u uw verjaardag?",
    "anniv.banner.sub": "Deel de datum met de familie van de kerk — wij vieren u graag!",
    "anniv.banner.cta": "Mijn verjaardag delen",
    "jefc.social.label": "Volg de JEFC",
    "dons.eyebrow": "Geef met vreugde",
    "hero.eyebrow": "Welkom bij",
    "hero.title.1": "Evangelisch Centrum",
    "hero.title.2": "De Christelijke Familie",
    "hero.sub": "U bent welkom in onze familie. Samen in geloof, gebed en broederschap.",
    "hero.cta.hours": "Onze uren",
    "hero.cta.live": "Live volgen",
    "services.eyebrow": "Bijeenkomsten",
    "services.title.1": "Kom",
    "services.title.2": "zoals u bent",
    "services.sub": "Drie wekelijkse momenten om samen te groeien in geloof.",
    "annonces.eyebrow": "Niet te missen",
    "annonces.title.1": "Aankondigingen",
    "annonces.title.2": "& evenementen",
    "contact.team": "Pastoraal team",
    "contact.pastor.role": "Hoofdpastor",
    "contact.pastor.wife.role": "Echtgenote van de pastor",
    "contact.secretary.role": "Secretaresse van de kerk",
    "contact.note": "Voor elke vraag kunt u zich richten tot onze secretaresse. De pastor ontvangt enkel op afspraak.",
    "contact.yt.title": "Online dienst",
    "contact.yt.sub": "Bekijk onze diensten live en in herhaling op ons YouTube-kanaal.",
    "pastor.eyebrow": "Op afspraak",
    "pastor.title.1": "Afspraak met",
    "pastor.title.2": "de Pastor",
    "pastor.sub": "Een moment van luisteren, gebed en persoonlijke begeleiding met Pastor Guy KOBI. Consultaties gebeuren enkel op afspraak, via het secretariaat.",
    "pastor.cta": "Een afspraak aanvragen",
    "pastor.via": "Via het secretariaat",
    "pastor.confidential": "Strikt vertrouwelijk",
    "vm.eyebrow": "Wie zijn wij",
    "vm.title": "Visie & Missie",
    "vm.intro": "Wij zijn een evangelische kerk in het Frans en het Nederlands, gevestigd in Aalst, België. Onze deur staat open voor iedereen — zonder onderscheid van herkomst, levensloop of verleden. Kom zoals u bent.",
    "vm.vision.title": "Onze Visie",
    "vm.vision.text": "Het Evangelisch Centrum De Christelijke Familie verspreidt de boodschap van het evangelie. Wij prediken de naam van Jezus Christus. Die naam die redt, bevrijdt, verlost en uitredt. De enige naam die geluk en vreugde in het hart van mensen kan brengen en herstellen wat de vijand heeft gebroken.",
    "vm.mission.title": "Onze Missie",
    "vm.mission.text": "Christus terugbrengen in het gezin. Wij geloven vast dat het gezin de centrale pijler van onze samenleving is. Ons doel is de christelijke waarden in het hart van de gezinnen te herstellen, de familiale banden door het geloof te versterken, en van elk huis een plek te maken waar de aanwezigheid van Christus levend is, gedeeld en doorgegeven van generatie op generatie.",
    "vm.verse.text": "« Er is geen heil door iemand anders; want er is ook onder de hemel geen andere naam aan de mensen gegeven, waardoor wij moeten behouden worden. »",
    "vm.verse.ref": "Handelingen 4 : 12",
    "vm.val.parole.title": "Het Woord",
    "vm.val.parole.desc": "De Bijbel is ons fundament en onze gids voor elke beslissing.",
    "vm.val.priere.title": "Het Gebed",
    "vm.val.priere.desc": "Wij geloven in de kracht van gebed en zoeken samen Gods aangezicht.",
    "vm.val.famille.title": "De Familie",
    "vm.val.famille.desc": "Iedereen wordt verwelkomd, geliefd en begeleid op zijn weg.",
    "vm.val.evang.title": "De Evangelisatie",
    "vm.val.evang.desc": "Wij delen het goede nieuws met onze stad en de volkeren.",
    "jefc.sub": "Evangelische Jeugd · De Christelijke Familie",
    "galerie.prefix": "Momenten van",
    "navette.eyebrow": "Gratis dienst",
    "navette.title.1": "Een",
    "navette.title.2": "pendeldienst",
    "navette.title.3": "voor u",
    "navette.sub": "Een minibus staat tot uw beschikking om uw komst naar de kerk te vergemakkelijken.",
    "depts.eyebrow": "Organisatie",
    "depts.title.1": "Onze",
    "depts.title.2": "afdelingen",
    "depts.sub": "Negen teams in dienst van uitmuntendheid in het huis van God.",
    "contact.eyebrow": "Sluit u aan",
    "contact.title.1": "Contact &",
    "contact.title.2": "adres",
    "faq.eyebrow": "Veelgestelde vragen",
    "faq.title.1": "Heeft u",
    "faq.title.2": "vragen?",
    "faq.intro": "Hier vindt u antwoorden op de meest gestelde vragen. Aarzel niet om ons te contacteren als u niet vindt wat u zoekt.",
    "faq.q1": "Waar vinden de diensten plaats?",
    "faq.a1": "De diensten vinden plaats aan <strong>Wijngaardveld 29, 9300 Aalst</strong>. U bent welkom — geen inschrijving nodig, kom gewoon!",
    "faq.q2": "Wat zijn de uren van de diensten?",
    "faq.a2": "Wij komen samen elke <strong>zondag om 10u</strong>, en ook op <strong>woensdag en vrijdag om 18u</strong> voor gebed en bijbelstudie.",
    "faq.q3": "Is er een gratis pendeldienst?",
    "faq.a3": "Ja! Wij bieden een <strong>gratis pendeldienst</strong> aan. Raadpleeg de pagina Pendeldienst voor de haltes en tijden.",
    "faq.q4": "Worden de diensten online uitgezonden?",
    "faq.a4": "Ja! Onze diensten zijn live te bekijken op ons <strong>YouTube-kanaal — CE La Famille Chrétienne</strong>. U kunt ook de replay's bekijken.",
    "faq.q5": "Hoe sluit ik me aan bij een afdeling?",
    "faq.a5": "Ga naar de pagina <strong>Afdelingen</strong>, kies het team dat bij u past en vul het kandidatuurformulier in. De verantwoordelijke neemt contact met u op.",
    "faq.q6": "Hoe doe ik een gift aan de kerk?",
    "faq.a6": "U kunt een gift doen in persoon tijdens de diensten, of via bankoverschrijving. De volledige coördinaten staan op de pagina <strong>Giften</strong>.",
    "faq.q7": "Ik heb nog een vraag — wie kan ik contacteren?",
    "faq.a7": "Contacteer ons via de pagina <strong>Contact</strong> of schrijf ons op <a href='mailto:cefclaborne@gmail.com' class='faq-link'>cefclaborne@gmail.com</a>. Wij antwoorden zo snel mogelijk.",
  },
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.youth": "Youth",
    "nav.shuttle": "Shuttle",
    "nav.depts": "Departments",
    "nav.contact": "Contact",
    "nav.live": "Live",
    "nav.dons": "Giving",
    "anniv.banner.title": "Celebrating your birthday?",
    "anniv.banner.sub": "Share the date with the church family — we'd love to celebrate you!",
    "anniv.banner.cta": "Share my birthday",
    "jefc.social.label": "Follow JEFC",
    "dons.eyebrow": "Give with joy",
    "hero.eyebrow": "Welcome to",
    "hero.title.1": "Evangelical Centre",
    "hero.title.2": "The Christian Family",
    "hero.sub": "You are welcome in our family. Together in faith, prayer and fellowship.",
    "hero.cta.hours": "Our schedule",
    "hero.cta.live": "Join live",
    "services.eyebrow": "Gatherings",
    "services.title.1": "Come",
    "services.title.2": "as you are",
    "services.sub": "Three weekly gatherings to grow together in faith.",
    "annonces.eyebrow": "Not to be missed",
    "annonces.title.1": "Announcements",
    "annonces.title.2": "& events",
    "contact.team": "Pastoral team",
    "contact.pastor.role": "Senior pastor",
    "contact.pastor.wife.role": "Pastor's wife",
    "contact.secretary.role": "Church secretary",
    "contact.note": "For any request, contact our church secretary. The pastor receives by appointment only.",
    "contact.yt.title": "Online service",
    "contact.yt.sub": "Watch our services live and on replay on our YouTube channel.",
    "pastor.eyebrow": "By appointment",
    "pastor.title.1": "Appointment with",
    "pastor.title.2": "the Pastor",
    "pastor.sub": "A time of listening, prayer and personal guidance with Pastor Guy KOBI. Consultations are by appointment only, through the secretariat.",
    "pastor.cta": "Request an appointment",
    "pastor.via": "Through the secretariat",
    "pastor.confidential": "Strictly confidential",
    "vm.eyebrow": "Who we are",
    "vm.title": "Vision & Mission",
    "vm.intro": "We are an evangelical church in French and Dutch established in Alost, Belgium. Our door is open to everyone — without distinction of origin, journey or past. Come as you are.",
    "vm.vision.title": "Our Vision",
    "vm.vision.text": "The Evangelical Centre The Christian Family spreads the message of the gospel. We preach the name of Jesus Christ. That name that saves, liberates, frees and delivers. The only name capable of giving happiness and joy to people's hearts and repairing what the enemy has broken.",
    "vm.mission.title": "Our Mission",
    "vm.mission.text": "Bringing Christ back to the family. We firmly believe that the family is the central pillar of our society. Our objective is to restore Christian values at the heart of homes, to strengthen family bonds through faith, and to make every home a place where the presence of Christ is alive, shared and passed on from generation to generation.",
    "vm.verse.text": "« Nor is there salvation in any other, for there is no other name under heaven given among men by which we must be saved. »",
    "vm.verse.ref": "Acts 4 : 12",
    "vm.val.parole.title": "The Word",
    "vm.val.parole.desc": "The Bible is our foundation and our guide for every decision.",
    "vm.val.priere.title": "Prayer",
    "vm.val.priere.desc": "We believe in the power of prayer and seek God's face together.",
    "vm.val.famille.title": "Family",
    "vm.val.famille.desc": "Every person is welcomed, loved and accompanied on their journey.",
    "vm.val.evang.title": "Evangelization",
    "vm.val.evang.desc": "We share the good news with our city and the nations.",
    "jefc.sub": "Evangelical Youth · The Christian Family",
    "galerie.prefix": "Moments of",
    "navette.eyebrow": "Free service",
    "navette.title.1": "A",
    "navette.title.2": "shuttle",
    "navette.title.3": "for you",
    "navette.sub": "A minibus is at your disposal to make it easier to get to church.",
    "depts.eyebrow": "Organisation",
    "depts.title.1": "Our",
    "depts.title.2": "departments",
    "depts.sub": "Nine teams serving excellence in the house of God.",
    "contact.eyebrow": "Join us",
    "contact.title.1": "Contact &",
    "contact.title.2": "address",
    "faq.eyebrow": "Frequently asked questions",
    "faq.title.1": "Do you have",
    "faq.title.2": "questions?",
    "faq.intro": "Here are answers to the most common questions. Don't hesitate to contact us if you can't find what you're looking for.",
    "faq.q1": "Where do services take place?",
    "faq.a1": "Services are held at <strong>Wijngaardveld 29, 9300 Alost (Aalst)</strong>. You are welcome — no registration needed, just come!",
    "faq.q2": "What are the service times?",
    "faq.a2": "We gather every <strong>Sunday at 10am</strong>, as well as <strong>Wednesday and Friday at 6pm</strong> for prayer and Bible study.",
    "faq.q3": "Is there a free shuttle?",
    "faq.a3": "Yes! We offer a <strong>free shuttle service</strong>. Check the Shuttle page for stops and pick-up times.",
    "faq.q4": "Are services broadcast online?",
    "faq.a4": "Yes! Our services are streamed live on our <strong>YouTube channel — CE La Famille Chrétienne</strong>. You can also watch replays anytime.",
    "faq.q5": "How do I join a service department?",
    "faq.a5": "Visit the <strong>Departments</strong> page, choose the team that fits you and fill in the application form. The team leader will get in touch.",
    "faq.q6": "How can I make a donation to the church?",
    "faq.a6": "You can give in person during services, or by bank transfer. Full details are available on the <strong>Giving</strong> page.",
    "faq.q7": "I have another question — who should I contact?",
    "faq.a7": "Contact us via the <strong>Contact</strong> page or email us at <a href='mailto:cefclaborne@gmail.com' class='faq-link'>cefclaborne@gmail.com</a>. We respond as quickly as possible.",
  }
};

// Dictionnaire complet : chaque texte FR → traduction NL.
// On parcourt le DOM et on remplace tous les nœuds texte qui matchent.
const TRANSLATIONS_NL = {
  // NAV
  "Dons": "Giften",
  "Anniversaires": "Verjaardagen",
  // ANNIVERSARY BANNER
  "Vous fêtez votre anniversaire ?": "Viert u uw verjaardag?",
  "Partagez la date avec la famille de l'église — nous serons heureux de vous célébrer !": "Deel de datum met de familie van de kerk — wij vieren u graag!",
  "Partager mon anniversaire": "Mijn verjaardag delen",
  // JEFC SOCIAL
  "Suivez la JEFC": "Volg de JEFC",
  "Accueil": "Welkom",
  "Services": "Diensten",
  "Jeunesse": "Jeugd",
  "Navette": "Pendeldienst",
  "Départements": "Afdelingen",
  "Contact": "Contact",
  "Live": "Live",

  // HERO
  "2016 — 2026 · Centre Évangélique · Alost": "2016 — 2026 · Evangelisch Centrum · Aalst",
  "10 ans": "10 jaar",
  "de Grâce": "van Genade",
  "Célébrons ensemble dix années de fidélité divine.": "Laten we samen tien jaar goddelijke trouw vieren.",
  "Vous êtes les bienvenus dans la famille.": "U bent welkom in de familie.",
  "Nos horaires": "Onze uren",
  "Rejoindre le live": "Live volgen",

  // MARQUEE
  "Culte dominical 10h": "Zondagsdienst 10u",
  "Étude biblique mercredi 18h": "Bijbelstudie woensdag 18u",
  "Jeûne & prière vendredi 18h": "Vasten & gebed vrijdag 18u",
  "Navette gratuite depuis la gare d'Alost": "Gratis pendeldienst vanaf station Aalst",
  "JEFC — jeunesse toutes les 2 semaines": "JEFC — Jeugd om de 2 weken",
  "JEFC — Jeunesse Évangélique": "JEFC — Jeugd Evangelisch",
  "2016 – 2026 · 10 ans de Grâce": "2016 – 2026 · 10 jaar van Genade",

  // SERVICES
  "Rassemblements": "Bijeenkomsten",
  "Venez": "Kom",
  "comme vous êtes": "zoals u bent",
  "Trois rendez-vous hebdomadaires pour grandir ensemble dans la foi.": "Drie wekelijkse momenten om samen te groeien in geloof.",
  "Principal": "Hoofd",
  "Dimanche": "Zondag",
  "Mercredi": "Woensdag",
  "Vendredi": "Vrijdag",
  "Culte principal": "Hoofddienst",
  "Étude biblique": "Bijbelstudie",
  "Jeûne & prière": "Vasten & gebed",
  "Adoration, prédication et communion fraternelle. Le rendez-vous central de notre communauté.": "Aanbidding, prediking en broederlijke gemeenschap. Het centrale moment van onze gemeenschap.",
  "Approfondissement de la Parole dans un cadre intime et interactif.": "Verdieping van het Woord in een intieme en interactieve sfeer.",
  "Une soirée consacrée à l'intercession et à la recherche de la face de Dieu.": "Een avond gewijd aan voorbede en het zoeken van Gods aangezicht.",

  // LIVE BLOCK
  "Prochainement en direct": "Binnenkort live",
  "En direct maintenant": "Nu live",
  "Le culte est en direct": "De dienst is live",
  "Suivez nos cultes en direct": "Volg onze diensten live",
  "Tous les dimanches à 10h sur YouTube. Rediffusion disponible sur la chaîne.": "Elke zondag om 10u op YouTube. Herhaling beschikbaar op het kanaal.",
  "Rejoignez-nous dès maintenant sur YouTube pour suivre le culte dominical.": "Sluit u nu bij ons aan op YouTube voor de zondagsdienst.",
  "Voir sur YouTube": "Bekijk op YouTube",
  "Regarder le live": "Bekijk live",

  // JEFC
  "Toutes les 2 semaines": "Om de 2 weken",
  "Un espace de foi, de croissance et de fraternité.": "Een plek van geloof, groei en broederschap.",
  "La JEFC se réunit toutes les deux semaines pour un temps de partage, d'enseignement et d'adoration adapté à la jeunesse de notre communauté.":
    "JEFC komt om de twee weken samen voor een moment van delen, onderwijs en aanbidding aangepast aan de jeugd van onze gemeenschap.",
  "Fréquence": "Frequentie",
  "Lieu": "Locatie",

  // NAVETTE
  "Service gratuit": "Gratis dienst",
  "Une": "Een",
  "navette": "pendeldienst",
  "pour vous": "voor u",
  "Un mini-bus est mis à votre disposition pour faciliter votre venue. Aucune réservation nécessaire — montez simplement à bord.":
    "Een minibus staat tot uw beschikking om uw komst te vergemakkelijken. Geen reservering nodig — stap gewoon in.",
  "Navette église": "Pendeldienst kerk",
  "Gratuit": "Gratis",
  "Gare d'Alost": "Station Aalst",
  "Wijngaardveld 29": "Wijngaardveld 29",
  "Mer. & Ven.": "Woe. & Vrij.",
  "17h10 depuis la gare": "17u10 vanaf het station",
  "9h – 10h, navettes continues": "9u – 10u, doorlopende ritten",
  "Pas de réservation. Montez simplement à bord.": "Geen reservering. Stap gewoon in.",

  // DEPARTEMENTS
  "Organisation": "Organisatie",
  "Nos": "Onze",
  "départements": "afdelingen",
  "Neuf équipes au service de l'excellence dans la maison de Dieu.": "Negen teams in dienst van uitmuntendheid in het huis van God.",
  "Technique": "Techniek",
  "Son, écrans, photographie & diffusion. L'équipe qui rend chaque culte visible et audible.":
    "Geluid, schermen, fotografie & uitzending. Het team dat elke dienst zichtbaar en hoorbaar maakt.",
  "Média": "Media",
  "Réseaux sociaux & communication.": "Sociale media & communicatie.",
  "Chorale": "Koor",
  "Louange & adoration musicale.": "Lofzang & muzikale aanbidding.",
  "Écodim": "Zondagsschool",
  "École du dimanche pour enfants.": "Zondagsschool voor kinderen.",
  "Hospitalité & intégration. Les premières mains tendues à toute personne qui franchit la porte.":
    "Gastvrijheid & integratie. De eerste uitgestoken handen voor wie binnenkomt.",
  "Intercesseurs": "Voorbidders",
  "Équipe de prière & intercession.": "Gebedsteam & voorbede.",
  "Traducteurs": "Vertalers",
  "Traduction simultanée.": "Simultaanvertaling.",
  "Solidarité": "Solidariteit",
  "Aide sociale & fraternelle.": "Sociale & broederlijke hulp.",
  "Techniciens de surface": "Schoonmaakdienst",
  "Propreté & entretien des locaux.": "Netheid & onderhoud van de lokalen.",

  // MODALE
  "Département": "Afdeling",
  "Voulez-vous nous rejoindre ?": "Wilt u zich bij ons aansluiten?",
  "En savoir plus / Poser une question": "Meer weten / Een vraag stellen",
  "Tous les départements sont ouverts à ceux qui souhaitent servir avec un cœur disponible.":
    "Alle afdelingen staan open voor wie met een beschikbaar hart wil dienen.",
  "Retour": "Terug",
  "Prénom": "Voornaam",
  "Nom": "Naam",
  "E-mail": "E-mail",
  "Téléphone": "Telefoon",
  "Tranche d'âge": "Leeftijdsgroep",
  "— Sélectionner —": "— Selecteer —",
  "Moins de 18 ans": "Onder 18 jaar",
  "18 – 25 ans": "18 – 25 jaar",
  "26 – 35 ans": "26 – 35 jaar",
  "36 – 50 ans": "36 – 50 jaar",
  "Plus de 50 ans": "Meer dan 50 jaar",
  "Vos compétences ou intérêts": "Uw vaardigheden of interesses",
  "Un mot pour vous présenter": "Een woordje om uzelf voor te stellen",
  "Parlez-nous brièvement de vous, de votre motivation, de votre disponibilité…":
    "Vertel ons kort over uzelf, uw motivatie en uw beschikbaarheid…",
  "Envoyer ma candidature": "Mijn aanvraag versturen",
  "Vous serez recontacté par le secrétariat dans les meilleurs délais.":
    "U wordt zo spoedig mogelijk gecontacteerd door het secretariaat.",
  "Une question sur ce département ? Le responsable vous répondra personnellement.":
    "Een vraag over deze afdeling? De verantwoordelijke beantwoordt u persoonlijk.",
  "Sujet": "Onderwerp",
  "Comprendre le rôle du département": "De rol van de afdeling begrijpen",
  "Disponibilités et engagement": "Beschikbaarheid en engagement",
  "Compétences requises": "Vereiste vaardigheden",
  "Témoigner / partager une idée": "Getuigen / een idee delen",
  "Autre": "Andere",
  "Votre question": "Uw vraag",
  "Posez votre question librement…": "Stel uw vraag vrijuit…",
  "Envoyer ma question": "Mijn vraag versturen",
  "Vous recevrez une réponse à l'adresse indiquée.": "U ontvangt een antwoord op het opgegeven adres.",
  "Merci pour votre demande !": "Bedankt voor uw aanvraag!",
  "Votre candidature a bien été enregistrée. Le secrétariat vous recontactera prochainement. Que Dieu vous bénisse.":
    "Uw aanvraag is goed geregistreerd. Het secretariaat zal u binnenkort contacteren. Moge God u zegenen.",
  "Question envoyée !": "Vraag verzonden!",
  "Votre message a bien été transmis au responsable. Vous recevrez une réponse dans les meilleurs délais.":
    "Uw bericht is goed doorgegeven aan de verantwoordelijke. U ontvangt zo spoedig mogelijk een antwoord.",
  "Fermer": "Sluiten",

  // CONTACT
  "Nous rejoindre": "Sluit u aan",
  "Contact &": "Contact &",
  "adresse": "adres",
  "Adresse": "Adres",
  "Voir sur la carte": "Bekijk op de kaart",
  "Équipe pastorale": "Pastoraal team",
  "Pasteur Guy KOBI": "Pastor Guy KOBI",
  "Pasteur principal": "Hoofdpastor",
  "Safi Mudiri": "Safi Mudiri",
  "Secrétaire de l'église": "Secretaresse van de kerk",
  "Pour toute demande, adressez-vous à notre secrétaire d'église. Le pasteur reçoit uniquement sur rendez-vous.":
    "Voor elke vraag kunt u zich richten tot onze secretaresse. De pastor ontvangt enkel op afspraak.",
  "Culte en ligne": "Online dienst",
  "Retrouvez nos cultes en direct et en rediffusion sur notre chaîne YouTube.":
    "Bekijk onze diensten live en in herhaling op ons YouTube-kanaal.",

  // PASTOR BANNER
  "Sur rendez-vous": "Op afspraak",
  "Rendez-vous avec": "Afspraak met",
  "le Pasteur": "de Pastor",
  "Un temps d'écoute, de prière et d'accompagnement personnel avec le Pasteur Guy KOBI. Les consultations se font uniquement sur rendez-vous, via le secrétariat.":
    "Een moment van luisteren, gebed en persoonlijke begeleiding met Pastor Guy KOBI. Consultaties gebeuren enkel op afspraak, via het secretariaat.",
  "Demander un rendez-vous": "Een afspraak aanvragen",
  "Via le secrétariat": "Via het secretariaat",
  "Strictement confidentiel": "Strikt vertrouwelijk",

  // FOOTER
  "« Car nous sommes tous un seul corps en Christ. »": "« Want wij zijn allen één lichaam in Christus. »",
  "Romains 12 : 5": "Romeinen 12 : 5",
  "Horaires": "Uren",
  "© 2026 CEFC – Alost. Tous droits réservés.": "© 2026 CEFC – Aalst. Alle rechten voorbehouden.",
  "10 ans de Grâce": "10 jaar van Genade",
  "· 10 ans de Grâce": "· 10 jaar van Genade",

  // BRAND
  "La Famille Chrétienne": "De Christelijke Familie",
  "Jeunesse · La Famille Chrétienne": "Jeugd · De Christelijke Familie",

  // ADRESSE
  "9300 Alost (Aalst)": "9300 Aalst",
  "Belgique": "België",

  // EQUIPE PASTORALE
  "Mimi Mbenza": "Mimi Mbenza",
  "Épouse du pasteur": "Echtgenote van de pastor",

  // NAVETTE NOUVELLE VERSION
  "Un mini-bus est mis à votre disposition pour faciliter votre venue à l'église.":
    "Een minibus staat tot uw beschikking om uw komst naar de kerk te vergemakkelijken.",
  "Aucune réservation": "Geen reservering",
  "↔ Wijngaardveld 29": "↔ Wijngaardveld 29",
  "Un mini-bus assure la liaison entre la gare et notre lieu de culte. Montez simplement à bord aux horaires indiqués — le service est entièrement gratuit et ouvert à tous.":
    "Een minibus verzorgt de verbinding tussen het station en onze plaats van eredienst. Stap gewoon in op de aangegeven tijden — de dienst is volledig gratis en open voor iedereen.",
  "9h — 10h": "9u — 10u",
  "Navettes continues entre la gare et l'église avant le culte principal.":
    "Doorlopende ritten tussen het station en de kerk vóór de hoofddienst.",
  "Départ depuis la Gare d'Alost vers l'église pour l'étude biblique.":
    "Vertrek vanaf station Aalst naar de kerk voor de bijbelstudie.",
  "Départ depuis la Gare d'Alost vers l'église pour le jeûne & la prière.":
    "Vertrek vanaf station Aalst naar de kerk voor vasten & gebed.",
  "Pas de réservation nécessaire — montez simplement à bord aux horaires indiqués.":
    "Geen reservering nodig — stap gewoon in op de aangegeven tijden.",

  // SCHEMA NAVETTE SVG (labels en majuscules)
  "GARE": "STATION",
  "D'ALOST": "AALST",
  "ÉGLISE": "KERK",
  "WIJNGAARDVELD 29": "WIJNGAARDVELD 29",

  // HORAIRES SERVICES
  "10h00": "10u00",
  "18h00": "18u00",
  "17h10": "17u10",

  // TICKER
  "Gratuite depuis la Gare d'Alost": "Gratis van station Aalst",
  "Bienvenue dans la famille": "U bent welkom in de familie",
  "Jeunesse · toutes les 2 semaines": "Jeugd · om de 2 weken",
  "Dimanche": "Zondag",
  "Culte principal · 10h00": "Hoofddienst · 10u00",
  "Mercredi": "Woensdag",
  "Étude biblique · 18h00": "Bijbelstudie · 18u00",
  "Vendredi": "Vrijdag",
  "Jeûne & prière · 18h00": "Vasten & gebed · 18u00",

  // YOUTUBE
  "YouTube": "YouTube",
  "@CE_laFamilleChretienne": "@CE_laFamilleChretienne",

  // ANNONCES
  "À ne pas manquer": "Niet te missen",
  "Annonces": "Aankondigingen",
  "& événements": "& evenementen",
  "À la une": "Uitgelicht",

  // LIVE BLOCK (nouvelles chaînes)
  "Cultes chaque dimanche à 10h, mercredi et vendredi à 18h.": "Diensten elke zondag om 10u, woensdag en vrijdag om 18u.",
  "Rejoignez-nous dès maintenant — le culte est diffusé sur notre chaîne.": "Sluit u nu bij ons aan — de dienst is live op ons kanaal.",

  // VISION & MISSION
  "Qui sommes-nous": "Wie zijn wij",
  "Notre": "Onze",
  "Vision & Mission": "Visie & Missie",
  "Notre Vision": "Onze Visie",
  "Notre Mission": "Onze Missie",
  "La Parole": "Het Woord",
  "La Prière": "Het Gebed",
  "La Famille": "De Familie",
  "L'Évangélisation": "De Evangelisatie",
};

// ===== TRADUCTIONS ANGLAISES =====
const TRANSLATIONS_EN = {
  // NAV
  "Dons": "Giving",
  "Anniversaires": "Birthdays",
  // ANNIVERSARY BANNER
  "Vous fêtez votre anniversaire ?": "Celebrating your birthday?",
  "Partagez la date avec la famille de l'église — nous serons heureux de vous célébrer !": "Share the date with the church family — we'd love to celebrate you!",
  "Partager mon anniversaire": "Share my birthday",
  // JEFC SOCIAL
  "Suivez la JEFC": "Follow JEFC",
  "Accueil": "Home",
  "Services": "Services",
  "Jeunesse": "Youth",
  "Navette": "Shuttle",
  "Départements": "Departments",
  "Contact": "Contact",
  "Live": "Live",

  // HERO
  "2016 — 2026 · Centre Évangélique · Alost": "2016 — 2026 · Evangelical Centre · Alost",
  "10 ans": "10 years",
  "de Grâce": "of Grace",
  "Célébrons ensemble dix années de fidélité divine.": "Let us celebrate together ten years of divine faithfulness.",
  "Vous êtes les bienvenus dans la famille.": "You are welcome in the family.",
  "Nos horaires": "Our schedule",
  "Rejoindre le live": "Join live",

  // MARQUEE
  "Culte dominical 10h": "Sunday service 10am",
  "Étude biblique mercredi 18h": "Bible study Wednesday 6pm",
  "Jeûne & prière vendredi 18h": "Fasting & prayer Friday 6pm",
  "Navette gratuite depuis la gare d'Alost": "Free shuttle from Alost station",
  "JEFC — jeunesse toutes les 2 semaines": "JEFC — youth every 2 weeks",
  "JEFC — Jeunesse Évangélique": "JEFC — Evangelical Youth",
  "2016 – 2026 · 10 ans de Grâce": "2016 – 2026 · 10 years of Grace",

  // SERVICES
  "Rassemblements": "Gatherings",
  "Venez": "Come",
  "comme vous êtes": "as you are",
  "Trois rendez-vous hebdomadaires pour grandir ensemble dans la foi.": "Three weekly gatherings to grow together in faith.",
  "Principal": "Main",
  "Dimanche": "Sunday",
  "Mercredi": "Wednesday",
  "Vendredi": "Friday",
  "Culte principal": "Main service",
  "Étude biblique": "Bible study",
  "Jeûne & prière": "Fasting & prayer",
  "Adoration, prédication et communion fraternelle. Le rendez-vous central de notre communauté.": "Worship, preaching and brotherly fellowship. The central gathering of our community.",
  "Approfondissement de la Parole dans un cadre intime et interactif.": "In-depth study of the Word in an intimate and interactive setting.",
  "Une soirée consacrée à l'intercession et à la recherche de la face de Dieu.": "An evening dedicated to intercession and seeking the face of God.",

  // LIVE BLOCK
  "Prochainement en direct": "Coming live soon",
  "En direct maintenant": "Live now",
  "Le culte est en direct": "The service is live",
  "Suivez nos cultes en direct": "Watch our services live",
  "Cultes chaque dimanche à 10h, mercredi et vendredi à 18h.": "Services every Sunday at 10am, Wednesday and Friday at 6pm.",
  "Rejoignez-nous dès maintenant — le culte est diffusé sur notre chaîne.": "Join us now — the service is streaming on our channel.",
  "Tous les dimanches à 10h sur YouTube. Rediffusion disponible sur la chaîne.": "Every Sunday at 10am on YouTube. Replay available on the channel.",
  "Voir sur YouTube": "Watch on YouTube",
  "Regarder le live": "Watch live",

  // VISION & MISSION
  "Qui sommes-nous": "Who we are",
  "Notre": "Our",
  "Vision & Mission": "Vision & Mission",
  "Notre Vision": "Our Vision",
  "Notre Mission": "Our Mission",
  "La Parole": "The Word",
  "La Prière": "Prayer",
  "La Famille": "Family",
  "L'Évangélisation": "Evangelization",

  // JEFC
  "Toutes les 2 semaines": "Every 2 weeks",
  "Un espace de foi, de croissance et de fraternité.": "A space of faith, growth and fellowship.",
  "La JEFC se réunit toutes les deux semaines pour un temps de partage, d'enseignement et d'adoration adapté à la jeunesse de notre communauté.":
    "JEFC meets every two weeks for a time of sharing, teaching and worship adapted to the youth of our community.",
  "Fréquence": "Frequency",
  "Lieu": "Location",

  // NAVETTE
  "Service gratuit": "Free service",
  "Une": "A",
  "navette": "shuttle",
  "pour vous": "for you",
  "Un mini-bus est mis à votre disposition pour faciliter votre venue à l'église.": "A minibus is available to facilitate your journey to church.",
  "Navette église": "Church shuttle",
  "Gratuit": "Free",
  "Aucune réservation": "No reservation",
  "Gare d'Alost": "Alost station",
  "Wijngaardveld 29": "Wijngaardveld 29",
  "Mer. & Ven.": "Wed. & Fri.",
  "17h10 depuis la gare": "17:10 from the station",
  "9h – 10h, navettes continues": "9am – 10am, continuous runs",
  "Pas de réservation. Montez simplement à bord.": "No reservation. Simply board the bus.",
  "Un mini-bus assure la liaison entre la gare et notre lieu de culte. Montez simplement à bord aux horaires indiqués — le service est entièrement gratuit et ouvert à tous.":
    "A minibus connects the station to our place of worship. Simply board at the indicated times — the service is entirely free and open to all.",
  "9h — 10h": "9am — 10am",
  "Navettes continues entre la gare et l'église avant le culte principal.": "Continuous runs between the station and the church before the main service.",
  "Départ depuis la Gare d'Alost vers l'église pour l'étude biblique.": "Departure from Alost station to the church for Bible study.",
  "Départ depuis la Gare d'Alost vers l'église pour le jeûne & la prière.": "Departure from Alost station to the church for fasting & prayer.",
  "Pas de réservation nécessaire — montez simplement à bord aux horaires indiqués.": "No reservation needed — simply board at the indicated times.",
  "GARE": "STATION",
  "D'ALOST": "ALOST",
  "ÉGLISE": "CHURCH",

  // DEPARTEMENTS
  "Organisation": "Organisation",
  "Nos": "Our",
  "départements": "departments",
  "Neuf équipes au service de l'excellence dans la maison de Dieu.": "Nine teams serving excellence in the house of God.",
  "Technique": "Technical",
  "Son, écrans, photographie & diffusion. L'équipe qui rend chaque culte visible et audible.":
    "Sound, screens, photography & broadcasting. The team that makes every service visible and audible.",
  "Média": "Media",
  "Réseaux sociaux & communication.": "Social media & communication.",
  "Chorale": "Choir",
  "Louange & adoration musicale.": "Praise & musical worship.",
  "Écodim": "Sunday school",
  "École du dimanche pour enfants.": "Sunday school for children.",
  "Hospitalité & intégration. Les premières mains tendues à toute personne qui franchit la porte.":
    "Hospitality & integration. The first hands extended to every person who walks through the door.",
  "Intercesseurs": "Intercessors",
  "Équipe de prière & intercession.": "Prayer & intercession team.",
  "Traducteurs": "Translators",
  "Traduction simultanée.": "Simultaneous translation.",
  "Solidarité": "Solidarity",
  "Aide sociale & fraternelle.": "Social & brotherly support.",
  "Techniciens de surface": "Cleaning team",
  "Propreté & entretien des locaux.": "Cleanliness & maintenance of the premises.",

  // MODALE DEPT
  "Département": "Department",
  "Voulez-vous nous rejoindre ?": "Would you like to join us?",
  "En savoir plus / Poser une question": "Learn more / Ask a question",
  "Tous les départements sont ouverts à ceux qui souhaitent servir avec un cœur disponible.":
    "All departments are open to those who wish to serve with a willing heart.",
  "Retour": "Back",
  "Prénom": "First name",
  "Nom": "Last name",
  "E-mail": "E-mail",
  "Téléphone": "Phone",
  "Tranche d'âge": "Age group",
  "— Sélectionner —": "— Select —",
  "Moins de 18 ans": "Under 18",
  "18 – 25 ans": "18 – 25 years",
  "26 – 35 ans": "26 – 35 years",
  "36 – 50 ans": "36 – 50 years",
  "Plus de 50 ans": "Over 50",
  "Vos compétences ou intérêts": "Your skills or interests",
  "Un mot pour vous présenter": "A few words about yourself",
  "Parlez-nous brièvement de vous, de votre motivation, de votre disponibilité…": "Tell us briefly about yourself, your motivation and your availability…",
  "Envoyer ma candidature": "Submit my application",
  "Vous serez recontacté par le secrétariat dans les meilleurs délais.": "You will be contacted by the secretariat as soon as possible.",
  "Une question sur ce département ? Le responsable vous répondra personnellement.": "A question about this department? The manager will answer you personally.",
  "Sujet": "Subject",
  "Comprendre le rôle du département": "Understand the department's role",
  "Disponibilités et engagement": "Availability and commitment",
  "Compétences requises": "Required skills",
  "Témoigner / partager une idée": "Share a testimony / idea",
  "Autre": "Other",
  "Votre question": "Your question",
  "Posez votre question librement…": "Ask your question freely…",
  "Envoyer ma question": "Send my question",
  "Vous recevrez une réponse à l'adresse indiquée.": "You will receive a reply at the address provided.",
  "Merci pour votre demande !": "Thank you for your request!",
  "Votre candidature a bien été enregistrée. Le secrétariat vous recontactera prochainement. Que Dieu vous bénisse.":
    "Your application has been registered. The secretariat will contact you soon. God bless you.",
  "Question envoyée !": "Question sent!",
  "Votre message a bien été transmis au responsable. Vous recevrez une réponse dans les meilleurs délais.":
    "Your message has been forwarded to the manager. You will receive a reply as soon as possible.",
  "Fermer": "Close",

  // CONTACT
  "Nous rejoindre": "Join us",
  "Contact &": "Contact &",
  "adresse": "address",
  "Adresse": "Address",
  "Voir sur la carte": "View on map",
  "Équipe pastorale": "Pastoral team",
  "Pasteur Guy KOBI": "Pastor Guy KOBI",
  "Pasteur principal": "Senior pastor",
  "Safi Mudiri": "Safi Mudiri",
  "Secrétaire de l'église": "Church secretary",
  "Pour toute demande, adressez-vous à notre secrétaire d'église. Le pasteur reçoit uniquement sur rendez-vous.":
    "For any request, contact our church secretary. The pastor receives by appointment only.",
  "Culte en ligne": "Online service",
  "Retrouvez nos cultes en direct et en rediffusion sur notre chaîne YouTube.": "Watch our services live and on replay on our YouTube channel.",

  // RENDEZ-VOUS PASTEUR
  "Sur rendez-vous": "By appointment",
  "Rendez-vous avec": "Appointment with",
  "le Pasteur": "the Pastor",
  "Un temps d'écoute, de prière et d'accompagnement personnel avec le Pasteur Guy KOBI. Les consultations se font uniquement sur rendez-vous, via le secrétariat.":
    "A time of listening, prayer and personal guidance with Pastor Guy KOBI. Consultations are by appointment only, through the secretariat.",
  "Demander un rendez-vous": "Request an appointment",
  "Via le secrétariat": "Through the secretariat",
  "Strictement confidentiel": "Strictly confidential",

  // FOOTER
  "« Car nous sommes tous un seul corps en Christ. »": "« For we are all one body in Christ. »",
  "Romains 12 : 5": "Romans 12 : 5",
  "Horaires": "Schedule",
  "© 2026 CEFC – Alost. Tous droits réservés.": "© 2026 CEFC – Alost. All rights reserved.",
  "10 ans de Grâce": "10 years of Grace",
  "· 10 ans de Grâce": "· 10 years of Grace",

  // BRAND
  "La Famille Chrétienne": "The Christian Family",
  "Jeunesse · La Famille Chrétienne": "Youth · The Christian Family",

  // ADRESSE
  "9300 Alost (Aalst)": "9300 Alost (Aalst)",
  "Belgique": "Belgium",

  // EQUIPE
  "Mimi Mbenza": "Mimi Mbenza",
  "Épouse du pasteur": "Pastor's wife",

  // ANNONCES
  "À ne pas manquer": "Not to be missed",
  "Annonces": "Announcements",
  "& événements": "& events",
  "À la une": "Featured",

  // TICKER
  "Gratuite depuis la Gare d'Alost": "Free from Alost station",
  "Bienvenue dans la famille": "Welcome to the family",
  "Jeunesse · toutes les 2 semaines": "Youth · every 2 weeks",
  "Dimanche": "Sunday",
  "Culte principal · 10h00": "Main service · 10am",
  "Mercredi": "Wednesday",
  "Étude biblique · 18h00": "Bible study · 6pm",
  "Vendredi": "Friday",
  "Jeûne & prière · 18h00": "Fasting & prayer · 6pm",
};

// Stockage des textes FR originaux pour pouvoir revenir en arrière
const originalTexts = new WeakMap();

function collectAndStoreOriginals() {
  // On parcourt tous les nœuds texte du body
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip vide, scripts, styles, code
      const t = node.nodeValue.trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(node => {
    if (!originalTexts.has(node)) {
      originalTexts.set(node, node.nodeValue);
    }
  });
  return nodes;
}

// Aussi : certains textes sont dans des attributs (placeholder, value, aria-label, title)
const TRANSLATABLE_ATTRS = ['placeholder', 'aria-label', 'title', 'value'];
const originalAttrs = new WeakMap();

function collectAttrOriginals() {
  document.querySelectorAll('[placeholder], [aria-label], [title], input[type="submit"][value], input[type="button"][value]').forEach(el => {
    if (!originalAttrs.has(el)) {
      const obj = {};
      TRANSLATABLE_ATTRS.forEach(attr => {
        const v = el.getAttribute(attr);
        if (v) obj[attr] = v;
      });
      originalAttrs.set(el, obj);
    }
  });
}

function applyLanguage(lang) {
  const dict = lang === 'nl' ? TRANSLATIONS_NL : lang === 'en' ? TRANSLATIONS_EN : null;

  // Persister la langue AVANT toute opération (le CMS lit cette valeur)
  try { localStorage.setItem('cefcLang', lang); } catch (e) {}

  // 0) Ré-appliquer le contenu CMS dans la bonne langue
  if (CMS_DATA) {
    applyCmsContent();
    document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
    collectAndStoreOriginals();
    collectAttrOriginals();
  }

  // 1) Mettre à jour le bloc live dans la nouvelle langue
  updateLiveStatus();

  // 2) Texte des nœuds via le dictionnaire
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const t = node.nodeValue.trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const original = originalTexts.get(node);
    if (!original) continue;
    if (dict) {
      const trimmed = original.trim();
      if (dict[trimmed]) {
        const leading  = original.match(/^\s*/)[0];
        const trailing = original.match(/\s*$/)[0];
        node.nodeValue = leading + dict[trimmed] + trailing;
      } else {
        node.nodeValue = original;
      }
    } else {
      node.nodeValue = original; // FR : restaure l'original
    }
  }

  // 3) Attributs (placeholder, aria-label, title, value)
  document.querySelectorAll('[placeholder], [aria-label], [title], input[type="submit"][value], input[type="button"][value]').forEach(el => {
    const orig = originalAttrs.get(el);
    if (!orig) return;
    TRANSLATABLE_ATTRS.forEach(attr => {
      if (!orig[attr]) return;
      el.setAttribute(attr, (dict && dict[orig[attr]]) ? dict[orig[attr]] : orig[attr]);
    });
  });

  // 4) Traductions par clé — s'applique EN DERNIER pour corriger les éléments
  //    que le marcheur de nœuds ne peut pas couvrir (contenus CMS sans _nl/_en,
  //    textes longs hors dictionnaire, éléments mixtes SVG + texte).
  if (lang !== 'fr') {
    const i18nDict = I18N[lang];
    if (i18nDict) {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!(key in i18nDict)) return;
        const val = i18nDict[key];
        // Modifier le nœud texte existant (pas el.textContent) pour conserver
        // les références WeakMap et les enfants non-texte (SVG, icônes…).
        const tn = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.nodeValue.trim());
        if (!tn) return;
        const lead  = tn.nodeValue.match(/^\s*/)[0];
        const trail = tn.nodeValue.match(/\s*$/)[0];
        if (!originalTexts.has(tn)) originalTexts.set(tn, tn.nodeValue);
        tn.nodeValue = lead + val + trail;
      });
    }
  }

  // 5) Lang attribute + boutons actifs
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// Init i18n
collectAndStoreOriginals();
collectAttrOriginals();
const savedLang = (() => {
  try { return localStorage.getItem('cefcLang'); } catch (e) { return null; }
})();
if (savedLang && savedLang !== 'fr') applyLanguage(savedLang);

// Click handlers
document.querySelectorAll('.lang-switch button').forEach(btn => {
  btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
});

// ===== BOUTON RDV PASTEUR : ouvre un mailto pré-rempli =====
const pastorCta = document.getElementById('pastorCta');
if (pastorCta) {
  pastorCta.addEventListener('click', (e) => {
    e.preventDefault();
    const isNL = document.documentElement.lang === 'nl';
    const subject = encodeURIComponent(isNL
      ? 'Aanvraag afspraak met Pastor Guy KOBI'
      : 'Demande de rendez-vous avec le Pasteur Guy KOBI');
    const body = encodeURIComponent(isNL ?
`Beste,

Ik wens een persoonlijke afspraak aan te vragen met Pastor Guy KOBI.

Voornaam :
Naam :
Telefoon :
E-mail :

Voorgestelde datum / tijdstip :
Onderwerp van de afspraak :

Met vriendelijke groet,

— Verzonden vanaf de website CEFC Aalst`
    :
`Bonjour,

Je souhaite prendre un rendez-vous personnel avec le Pasteur Guy KOBI.

Prénom :
Nom :
Téléphone :
E-mail :

Date / créneau souhaité :
Objet du rendez-vous :

Bien à vous,

— Envoyé depuis le site CEFC Alost`);
    window.location.href = `mailto:contact@cefclabornealost.be?subject=${subject}&body=${body}`;
  });
}

// ===== TILT 3D SUR LES CARTES DEPARTEMENTS =====
const isFinePointer = window.matchMedia('(pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (isFinePointer && !reducedMotion) {
  document.querySelectorAll('.dept-card').forEach(card => {
    const glare = card.querySelector('.dept-card-glare');
    let raf = null;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -8;
      const ry = ((x - cx) / cx) * 8;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        if (glare) {
          glare.style.setProperty('--gx', x + 'px');
          glare.style.setProperty('--gy', y + 'px');
        }
      });
    });

    card.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });
}

// ===== MODALE DEPARTEMENT =====
const DEPT_DATA = {
  technique: {
    name: 'Technique',
    sub: 'Son, écrans, photographie & diffusion. Vous avez un sens du détail technique et aimez servir dans l\'ombre ? Cette équipe est faite pour vous.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    dynLabel: 'Domaines qui vous intéressent',
    dynOptions: ['Sonorisation', 'Photographie', 'Régie vidéo', 'Streaming / live', 'Écrans / projection', 'Aucune expérience, à former']
  },
  media: {
    name: 'Média',
    sub: 'Réseaux sociaux, vidéo, design : aidez à porter le message au-delà des murs de l\'église.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>',
    dynLabel: 'Vos compétences',
    dynOptions: ['Vidéo / montage', 'Graphisme', 'Rédaction', 'Réseaux sociaux', 'Communication']
  },
  chorale: {
    name: 'Chorale',
    sub: 'Louange et adoration musicale. Une oreille, une voix, un instrument à mettre au service du Seigneur ?',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    dynLabel: 'Votre rôle souhaité',
    dynOptions: ['Chant — soprano', 'Chant — alto', 'Chant — ténor', 'Chant — basse', 'Piano / clavier', 'Guitare', 'Basse', 'Batterie', 'Autre instrument']
  },
  ecodim: {
    name: 'Écodim',
    sub: 'École du dimanche pour enfants. Vous aimez transmettre la Parole aux plus petits avec patience et créativité ?',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    dynLabel: 'Tranche d\'âge préférée',
    dynOptions: ['Tout-petits (3-5 ans)', 'Enfants (6-9 ans)', 'Pré-ados (10-12 ans)', 'Indifférent']
  },
  accueil: {
    name: 'Accueil',
    sub: 'Vous êtes la première personne qu\'un visiteur rencontre. Sourire, écoute et chaleur sont vos outils principaux.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17a4 4 0 0 1-8 0V8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v9z"/><path d="M11 8h6c1.1 0 2 .9 2 2v6"/><path d="M19 16l3-3-3-3"/></svg>',
    dynLabel: 'Vos disponibilités',
    dynOptions: ['Dimanche matin', 'Mercredi soir', 'Vendredi soir', 'Événements ponctuels']
  },
  intercesseurs: {
    name: 'Intercesseurs',
    sub: 'Le ministère de la prière au cœur de l\'église. Persévérance, discrétion et passion pour la présence de Dieu.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    dynLabel: 'Votre expérience dans la prière',
    dynOptions: ['Débutant, à former', 'Pratique régulière', 'Engagé depuis plusieurs années', 'Ministère prophétique']
  },
  traducteurs: {
    name: 'Traducteurs',
    sub: 'Traduction simultanée. Donnez accès à la Parole à toutes les personnes présentes, quelle que soit leur langue.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
    dynLabel: 'Langues maîtrisées',
    dynOptions: ['Français', 'Néerlandais', 'Anglais', 'Lingala', 'Swahili', 'Espagnol', 'Portugais', 'Autre']
  },
  solidarite: {
    name: 'Solidarité',
    sub: 'Aide sociale et fraternelle. Le bras concret de l\'amour de Christ envers les plus fragiles de notre communauté.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 14h1v4"/><path d="M16 2v4M8 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>',
    dynLabel: 'Comment souhaitez-vous aider ?',
    dynOptions: ['Visites aux malades', 'Aide alimentaire', 'Soutien financier ponctuel', 'Écoute & accompagnement', 'Logistique / transport']
  },
  surface: {
    name: 'Techniciens de surface',
    sub: 'Propreté et entretien des locaux. Un service humble mais essentiel : l\'église doit toujours être un lieu digne pour la rencontre.',
    iconSvg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 7 18.2l1.9-5.8L4 8.8h6.1z"/></svg>',
    dynLabel: 'Vos disponibilités',
    dynOptions: ['Avant les cultes', 'Après les cultes', 'En semaine', 'Grand ménage périodique']
  }
};

const modal = document.getElementById('deptModal');
if (modal) {
const modalChoice = document.getElementById('modalChoice');
const modalForm = document.getElementById('modalForm');
const modalQuestionForm = document.getElementById('modalQuestionForm');
const modalSuccess = document.getElementById('formSuccess');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalSub = document.getElementById('modalSub');
const dynLabel = document.getElementById('dynamicLabel');
const dynChecks = document.getElementById('dynamicChecks');
const successHeading = modalSuccess.querySelector('h3');
const successText = modalSuccess.querySelector('p');
let currentDept = null;

function showView(view) {
  modalChoice.style.display = view === 'choice' ? 'block' : 'none';
  modalForm.classList.toggle('active', view === 'form');
  modalQuestionForm.classList.toggle('active', view === 'question');
  modalSuccess.classList.toggle('active', view === 'success');
}

function openModal(deptKey) {
  const data = DEPT_DATA[deptKey];
  if (!data) return;
  currentDept = deptKey;

  modalIcon.innerHTML = data.iconSvg;
  modalTitle.textContent = data.name;
  modalSub.textContent = data.sub;
  dynLabel.textContent = data.dynLabel;

  dynChecks.innerHTML = data.dynOptions.map(opt => `
    <label class="form-check">
      <input type="checkbox" name="competence" value="${opt}" />
      ${opt}
    </label>
  `).join('');
  dynChecks.querySelectorAll('.form-check').forEach(label => {
    label.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const cb = label.querySelector('input');
        cb.checked = !cb.checked;
      }
      label.classList.toggle('selected', label.querySelector('input').checked);
    });
  });

  modalForm.reset();
  modalQuestionForm.reset();
  const fDept = document.getElementById('f-dept');
  const qDept = document.getElementById('q-dept');
  if (fDept) fDept.value = data.name;
  if (qDept) qDept.value = data.name;
  showView('choice');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentDept = null;
}

document.querySelectorAll('.dept-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(card.dataset.dept);
  });
});

document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

document.getElementById('btnJoin').addEventListener('click', () => showView('form'));
document.getElementById('btnInfo').addEventListener('click', () => showView('question'));
document.getElementById('formBack').addEventListener('click', () => showView('choice'));
document.getElementById('questionBack').addEventListener('click', () => showView('choice'));
document.getElementById('successClose').addEventListener('click', closeModal);

// Soumission formulaire candidature — envoi par mailto au secrétariat (pas de backend)
modalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(modalForm);
  const competences = Array.from(modalForm.querySelectorAll('input[name="competence"]:checked')).map(c => c.value);
  const deptName = DEPT_DATA[currentDept]?.name || '';

  const subject = encodeURIComponent(`Candidature département ${deptName} — ${data.get('prenom')} ${data.get('nom')}`);
  const lines = [
    `Département souhaité : ${deptName}`,
    ``,
    `Prénom : ${data.get('prenom') || ''}`,
    `Nom : ${data.get('nom') || ''}`,
    `E-mail : ${data.get('email') || ''}`,
    `Téléphone : ${data.get('tel') || ''}`,
    `Tranche d'âge : ${data.get('age') || ''}`,
    ``,
    `${DEPT_DATA[currentDept]?.dynLabel || 'Compétences/intérêts'} : ${competences.join(', ') || '—'}`,
    ``,
    `Présentation :`,
    `${data.get('message') || '—'}`,
    ``,
    `— Envoyé depuis le site CEFC Alost`
  ];
  const body = encodeURIComponent(lines.join('\n'));
  window.location.href = `mailto:contact@cefclabornealost.be?subject=${subject}&body=${body}`;

  successHeading.textContent = 'Merci pour votre demande !';
  successText.textContent = 'Votre candidature a bien été enregistrée. Le secrétariat vous recontactera prochainement. Que Dieu vous bénisse.';
  showView('success');
});

// Soumission formulaire question
modalQuestionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(modalQuestionForm);
  const deptName = DEPT_DATA[currentDept]?.name || '';

  const subject = encodeURIComponent(`Question — département ${deptName}${data.get('sujet') ? ' · ' + data.get('sujet') : ''}`);
  const lines = [
    `Département concerné : ${deptName}`,
    `Sujet : ${data.get('sujet') || '—'}`,
    ``,
    `De : ${data.get('prenom') || ''} ${data.get('nom') || ''}`,
    `E-mail : ${data.get('email') || ''}`,
    ``,
    `Question :`,
    `${data.get('message') || '—'}`,
    ``,
    `— Envoyé depuis le site CEFC Alost`
  ];
  const body = encodeURIComponent(lines.join('\n'));
  window.location.href = `mailto:contact@cefclabornealost.be?subject=${subject}&body=${body}`;

  successHeading.textContent = 'Question envoyée !';
  successText.textContent = 'Votre message a bien été transmis au responsable. Vous recevrez une réponse dans les meilleurs délais.';
  showView('success');
});
} // end if (modal)

// ===== GALERIE PHOTOS CULTE =====
// Charge photos_culte.json (fichier dédié, mis à jour par l'admin)
(function() {
  const track   = document.getElementById('galleryTrack');
  const dotsWrap= document.getElementById('galleryDots');
  const counter = document.getElementById('galleryCounter');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  if (!track) return;

  function buildGallery(rawPhotos) {
    // Accepte ["/img/uploads/photo.jpg", ...] ou [{url: "...", legende: "..."}]
    const validPhotos = (rawPhotos || [])
      .map(p => typeof p === 'string' ? { url: p, legende: '', date: '' } : p)
      .filter(p => p && p.url && p.url.trim());

    if (validPhotos.length === 0) {
      track.innerHTML = `
        <div class="gallery-placeholder">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p>Photos à venir</p>
        </div>`;
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    let current = 0;
    let autoTimer = null;

    validPhotos.forEach((p, i) => {
      const slide = document.createElement('div');
      slide.className = 'gallery-slide' + (i === 0 ? ' active' : '');
      slide.innerHTML = `
        <img src="${p.url}" alt="${p.legende || ''}" loading="${i === 0 ? 'eager' : 'lazy'}" />
        ${p.legende ? `<div class="gallery-slide-caption">${p.legende}${p.date ? ' · ' + p.date : ''}</div>` : ''}`;
      track.appendChild(slide);

    const dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Photo ${i+1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  if (validPhotos.length > 1) {
    counter.style.display = '';
    counter.textContent = `1 / ${validPhotos.length}`;
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

  function goTo(n) {
    const slides = track.querySelectorAll('.gallery-slide');
    const dots   = dotsWrap.querySelectorAll('.gallery-dot');
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + validPhotos.length) % validPhotos.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    track.style.transform = `translateX(-${current * 100}%)`;
    counter.textContent = `${current + 1} / ${validPhotos.length}`;
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 3000);
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

  const wrap = document.getElementById('galleryWrap');
  wrap.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrap.addEventListener('mouseleave', startAuto);

  // Swipe tactile
  let touchX = null;
  wrap.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { goTo(dx < 0 ? current + 1 : current - 1); startAuto(); }
    touchX = null;
  }, { passive: true });

  if (validPhotos.length > 1) startAuto();
  } // end buildGallery

  fetch('/photos_culte.json')
    .then(r => r.json())
    .then(data => buildGallery(data.photos || []))
    .catch(() => buildGallery([]));
})();
