document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initContactForm();
  initSliders();
  initSearch();
});

function initNav() {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    nav.classList.toggle("open");
    var expanded = nav.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(expanded));
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
    });
  });
}

function initContactForm() {
  var form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var success = form.querySelector(".form-success");
    if (success) {
      success.classList.add("visible");
    }
    form.reset();
  });
}

/* ===== Slider / carousel ===== */

function initSliders() {
  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector(".slider-track");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".slide"));
    var dotsWrap = root.querySelector(".slider-dots");
    var counter = root.querySelector(".slider-counter");
    var prevBtn = root.querySelector(".slider-prev");
    var nextBtn = root.querySelector(".slider-next");
    if (!track || slides.length === 0) return;

    var index = 0;
    var dots = [];

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Aller à la diapositive " + (i + 1));
        dot.addEventListener("click", function () {
          goTo(i);
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function render() {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
      if (counter) {
        counter.textContent = (index + 1) + " / " + slides.length;
      }
      slides.forEach(function (slide, i) {
        var video = slide.querySelector("video");
        if (video && i !== index) {
          video.pause();
        }
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });

    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "ArrowRight") goTo(index + 1);
    });

    var startX = null;
    track.addEventListener("pointerdown", function (event) {
      startX = event.clientX;
    });
    track.addEventListener("pointerup", function (event) {
      if (startX === null) return;
      var delta = event.clientX - startX;
      if (Math.abs(delta) > 40) {
        goTo(delta < 0 ? index + 1 : index - 1);
      }
      startX = null;
    });

    render();
  });
}

/* ===== Search ===== */

var SEARCH_INDEX = [
  { page: "Accueil", title: "Deux structures, une même vision", url: "index.html#axes", snippet: "Chris Business (facilitation d'affaires) et Chrisfoot (agent FIFA)." },
  { page: "Accueil", title: "Direction", url: "index.html#direction", snippet: "Serge Tungila Mwanza et Christian Yangongo Kapenga." },
  { page: "Accueil", title: "Jubilé de Tresor Mputu", url: "index.html#jubile", snippet: "2026, un grand événement organisé en RDC." },
  { page: "Accueil", title: "Galerie", url: "index.html#galerie", snippet: "Campagne En route vers le Mondial, Jubilé, délégations." },
  { page: "Accueil", title: "Ce que nous avons accompli", url: "index.html#realisations", snippet: "FECOFA, transferts internationaux, fondations partenaires, clubs européens." },
  { page: "Accueil", title: "Nos services", url: "index.html#services", snippet: "Facilitation d'affaires, représentation FIFA, partenariats médicaux, événementiel." },
  { page: "Accueil", title: "Questions fréquentes", url: "index.html#faq", snippet: "Comment devenir partenaire, institutions publiques, Jubilé." },
  { page: "Chris Business", title: "Votre porte d'entrée en RDC", url: "chris-business.html", snippet: "Facilitation d'affaires en République Démocratique du Congo." },
  { page: "Chris Business", title: "Nos clients actuels", url: "chris-business.html#clients", snippet: "Jetour, Swista, CNSS." },
  { page: "Chris Business", title: "Objectifs du partenariat", url: "chris-business.html#objectifs", snippet: "Élargir vos contacts, collaborer avec les autorités, installer votre structure." },
  { page: "Chris Business", title: "Trois fondations, un même engagement", url: "chris-business.html#fondations", snippet: "Fondation Denise Nyakeru Tshisekedi, Fondation Widal, FONAREV." },
  { page: "Chrisfoot", title: "Le football congolais à l'international", url: "chris-foot.html", snippet: "Agence intermédiaire FIFA basée en Flandre depuis 2015." },
  { page: "Chrisfoot", title: "Christian Luyindama", url: "chris-foot.html#luyindama", snippet: "International rd-congolais, réussi en RDC, en Belgique et en Turquie." },
  { page: "Chrisfoot", title: "Jubilé de Tresor Mputu", url: "chris-foot.html#jubile", snippet: "Galerie photo et vidéo de l'événement." },
  { page: "Chrisfoot", title: "Nos clubs partenaires en Europe", url: "chris-foot.html#international", snippet: "Olympique de Marseille, Standard de Liège, RB Leipzig." },
  { page: "Chrisfoot", title: "Une académie de football en RDC", url: "chris-foot.html#academie", snippet: "Un projet pour convaincre Mesut Özil de s'associer." },
  { page: "Chrisfoot", title: "Questions fréquentes", url: "chris-foot.html#faq", snippet: "Agent FIFA, footballeurs professionnels." },
  { page: "Partenariats", title: "Vendons ensemble votre image", url: "partenariats.html", snippet: "Opportunités de partenariat sportif, médical et international." },
  { page: "Partenariats", title: "Votre marque au cœur du football", url: "partenariats.html#visibilite", snippet: "Maillots, écrans LED, panneaux et stades." },
  { page: "Partenariats", title: "Chirurgie esthétique pour les blessés de guerre", url: "partenariats.html#medical", snippet: "Ministère des Anciens Combattants, FONAREV, INPP, Ministère de la Santé." },
  { page: "Partenariats", title: "Un pont entre la RDC et la Turquie", url: "partenariats.html#tourisme", snippet: "Tourisme médical." },
  { page: "Partenariats", title: "Une académie de football en RDC", url: "partenariats.html#academie", snippet: "Convaincre Mesut Özil de s'associer." },
  { page: "À propos", title: "Faire confiance à notre expertise", url: "a-propos.html", snippet: "La vision de Chris Business & Chrisfoot." },
  { page: "À propos", title: "Portée par des managers de conviction", url: "a-propos.html#equipe", snippet: "Serge Tungila Mwanza et Christian Yangongo Kapenga." },
  { page: "À propos", title: "Deux axes, une même ambition", url: "a-propos.html#mission", snippet: "Facilitation d'affaires et agent FIFA." },
  { page: "À propos", title: "Pourquoi la RDC", url: "a-propos.html#pourquoi-rdc", snippet: "Un point central pour conquérir l'Afrique." },
  { page: "Contact", title: "Devenez partenaire", url: "contact.html", snippet: "Téléphone, WhatsApp, email et formulaire de contact." }
];

function initSearch() {
  var trigger = document.querySelector("[data-search-trigger]");
  var overlay = document.querySelector("[data-search-overlay]");
  if (!trigger || !overlay) return;

  var input = overlay.querySelector("input");
  var resultsWrap = overlay.querySelector("[data-search-results]");
  var closeBtn = overlay.querySelector("[data-search-close]");
  var activeIndex = -1;
  var currentResults = [];

  function open() {
    overlay.classList.add("open");
    input.value = "";
    renderResults(SEARCH_INDEX.slice(0, 8));
    setTimeout(function () { input.focus(); }, 10);
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderResults(items) {
    currentResults = items;
    activeIndex = -1;
    resultsWrap.innerHTML = "";
    if (items.length === 0) {
      var empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "Aucun résultat. Essayez un autre mot-clé.";
      resultsWrap.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "search-result";
      a.href = item.url;
      a.innerHTML =
        '<span class="result-page">' + item.page + '</span>' +
        '<div class="result-title">' + item.title + '</div>' +
        '<p class="result-snippet">' + item.snippet + '</p>';
      resultsWrap.appendChild(a);
    });
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function doSearch(query) {
    var q = normalize(query.trim());
    if (q === "") {
      renderResults(SEARCH_INDEX.slice(0, 8));
      return;
    }
    var terms = q.split(/\s+/);
    var matches = SEARCH_INDEX.filter(function (item) {
      var haystack = normalize(item.title + " " + item.snippet + " " + item.page);
      return terms.every(function (term) { return haystack.indexOf(term) !== -1; });
    });
    renderResults(matches);
  }

  trigger.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) close();
  });

  input.addEventListener("input", function () {
    doSearch(input.value);
  });

  input.addEventListener("keydown", function (event) {
    var links = Array.prototype.slice.call(resultsWrap.querySelectorAll(".search-result"));
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, links.length - 1);
      updateActive(links);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive(links);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && links[activeIndex]) {
        window.location.href = links[activeIndex].getAttribute("href");
      } else if (links[0]) {
        window.location.href = links[0].getAttribute("href");
      }
    } else if (event.key === "Escape") {
      close();
    }
  });

  function updateActive(links) {
    links.forEach(function (link, i) {
      link.classList.toggle("active", i === activeIndex);
    });
    if (links[activeIndex]) {
      links[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  document.addEventListener("keydown", function (event) {
    var isShortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || event.key === "/";
    var typingInField = /input|textarea/i.test(document.activeElement.tagName);
    if (isShortcut && !typingInField) {
      event.preventDefault();
      open();
    } else if (event.key === "Escape" && overlay.classList.contains("open")) {
      close();
    }
  });
}
