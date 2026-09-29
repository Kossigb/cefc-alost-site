// Envoi automatique des formulaires du site par email (via l'API Brevo).
//
// Variables Netlify requises :
//   BREVO_API_KEY  clé API Brevo (app.brevo.com → SMTP & API → Clés API)
//   MAIL_FROM      adresse expéditrice validée dans Brevo (ex : cefclaborne@gmail.com)
//
// Les destinataires ne viennent JAMAIS du navigateur : ils sont lus dans contenu.json
// (réglés dans l'admin → Formulaires), pour que la fonction ne puisse pas servir à
// envoyer des emails à n'importe qui.

const FORMS = {
  candidature:  'Candidature département',
  question:     'Question département',
  rdv_pasteur:  'Demande de rendez-vous avec le pasteur',
  anniversaire: 'Anniversaire',
  rgpd:         'Demande RGPD',
};
const DEFAULTS = { anniversaire: 'cefclaborne@gmail.com' };
const FALLBACK = 'contact@cefclabornealost.be';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const reply = (statusCode, data) => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(data) });

const EMAIL_RE = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;
const emails = v => String(v || '').split(/[\s,;]+/).filter(x => EMAIL_RE.test(x));
const clip = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').slice(0, n);

// Limite simple : 5 envois par minute et par adresse IP (par instance)
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

async function loadContent(origin) {
  const res = await fetch(`${origin}/contenu.json?t=${Date.now()}`);
  if (!res.ok) throw new Error('contenu.json introuvable');
  return res.json();
}

function recipients(content, form, deptId) {
  const dept = deptId && Array.isArray(content.departements?.liste)
    ? content.departements.liste.find(d => d && d.id === deptId) : null;
  const candidates = [
    dept?.email,
    content.formulaires?.[form],
    form === 'rgpd' ? content.legal?.email_rgpd : '',
    DEFAULTS[form],
    content.infos?.email,
    FALLBACK,
  ];
  for (const c of candidates) {
    const list = emails(c);
    if (list.length) return list.slice(0, 5);
  }
  return [FALLBACK];
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Méthode non autorisée' });

  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return reply(503, { error: 'not_configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'JSON invalide' }); }

  // Champ piège : rempli uniquement par les robots
  if (body.website) return reply(200, { ok: true });

  const form = String(body.form || '');
  if (!FORMS[form]) return reply(400, { error: 'Formulaire inconnu' });

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'inconnu';
  if (tooMany(ip)) return reply(429, { error: 'Trop d\'envois, réessayez dans une minute.' });

  const text = clip(body.text, 6000);
  if (!text.trim()) return reply(400, { error: 'Message vide' });
  const subject = clip(body.subject, 160).replace(/\n/g, ' ') || FORMS[form];
  const replyEmail = EMAIL_RE.test(body.replyTo || '') ? body.replyTo : null;
  const replyName = clip(body.replyName, 80).replace(/\n/g, ' ');

  const origin = process.env.URL || `https://${event.headers.host}`;
  let content = {};
  try { content = await loadContent(origin); } catch { /* on garde les adresses par défaut */ }
  const to = recipients(content, form, clip(body.dept, 60));

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: from, name: 'Site CEFC Alost' },
      to: to.map(email => ({ email })),
      ...(replyEmail ? { replyTo: { email: replyEmail, ...(replyName ? { name: replyName } : {}) } } : {}),
      subject,
      textContent: `${text}\n\n—\nFormulaire « ${FORMS[form]} » du site ${origin.replace(/^https?:\/\//, '')}`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Brevo', res.status, detail);
    return reply(502, { error: 'send_failed' });
  }
  return reply(200, { ok: true });
};
