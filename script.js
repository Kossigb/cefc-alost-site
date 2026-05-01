'use strict';

/* ── Navbar scroll shadow ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Mobile burger ── */
const burger  = document.getElementById('burger');
const navMenu = document.getElementById('navMenu');

burger.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
navMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

/* ── Department data ── */
const departments = {
  technique: {
    title: 'Technique',
    body:  'Le département Technique est le pilier invisible de chaque célébration. Son équipe prend en charge l\'ensemble de la sonorisation — micros, tables de mixage, retours de scène —, l\'éclairage de la salle, la gestion des écrans d\'affichage présents dans le lieu de culte, ainsi que la captation et la diffusion du culte en direct sur YouTube. Sans ce département, ni la prédication ni la louange ne pourraient atteindre leur plein impact.'
  },
  media: {
    title: 'Média',
    body:  'L\'équipe Média est la voix numérique de l\'église. Elle administre les réseaux sociaux (Facebook, Instagram, WhatsApp), conçoit les visuels des événements et des annonces, et veille à la cohérence de la communication externe de la CEFC. C\'est grâce à ce département que des centaines de personnes restent connectées à la vie de la communauté, même à distance.'
  },
  chorale: {
    title: 'Chorale',
    body:  'La Chorale conduit l\'assemblée dans un temps d\'adoration sincère et puissant. Composée de chanteurs et de musiciens passionnés, elle répète chaque semaine afin d\'offrir un moment de louange d\'excellence. Elle est le pont entre les cœurs des fidèles et la présence de Dieu dans le lieu de culte.'
  },
  ecodim: {
    title: 'Écodim — École du Dimanche',
    body:  'L\'Écodim accueille les enfants pendant le culte principal et leur propose un enseignement biblique adapté à leur âge, à travers des histoires, des activités créatives, du chant et de l\'adoration. L\'objectif est de poser de solides fondations de foi dans le cœur de chaque enfant, dès le plus jeune âge.'
  },
  accueil: {
    title: 'Accueil',
    body:  'Le département Accueil est souvent la première impression qu\'un visiteur reçoit de notre église. Ces serviteurs chaleureux accueillent chaque fidèle et chaque nouveau venu avec joie, distribuent les bulletins, orientent les personnes et veillent à ce que chacun se sente chez lui dans la maison de Dieu.'
  },
  intercesseurs: {
    title: 'Intercesseurs',
    body:  'Les Intercesseurs constituent le cœur battant de l\'église dans la prière. Avant chaque service, ils se réunissent pour intercéder en faveur des autorités, des membres, des malades et de la nation. Ils forment un rempart spirituel autour de la communauté et portent devant Dieu les besoins de chaque famille.'
  },
  traducteurs: {
    title: 'Traducteurs',
    body:  'Notre communauté étant multiculturelle, les Traducteurs assurent la traduction simultanée des prédications et des annonces, du français vers d\'autres langues pratiquées au sein de l\'assemblée. Ils permettent à chaque membre de recevoir la Parole dans sa propre langue, favorisant une compréhension profonde et une unité fraternelle.'
  },
  solidarite: {
    title: 'Solidarité',
    body:  'Le département Solidarité œuvre pour les personnes les plus vulnérables au sein et autour de la communauté. Il organise des collectes alimentaires, une aide aux familles en difficulté, et un accompagnement lors de deuils ou de situations précaires. Ce département incarne concrètement le commandement du Christ : « Aimez-vous les uns les autres. »'
  },
  surface: {
    title: 'Techniciens de Surface',
    body:  'Les Techniciens de Surface sont des serviteurs discrets mais indispensables. Ils assurent la propreté, l\'entretien et la bonne organisation des espaces de l\'église avant et après chaque service. Leur travail silencieux garantit que la maison de Dieu demeure un lieu digne, propre et accueillant pour tous les fidèles et visiteurs.'
  }
};

/* ── Modal open / close ── */
function openModal(key) {
  const d = departments[key];
  if (!d) return;
  document.getElementById('modalTitle').textContent = d.title;
  document.getElementById('modalBody').textContent  = d.body;
  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
