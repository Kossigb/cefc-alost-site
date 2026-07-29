// Proxy GitHub API — utilise GITHUB_TOKEN côté serveur
// Tous les appelants doivent être authentifiés via Netlify Identity

const REPO = 'kossigb/cefc-alost-site';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { user } = context.clientContext || {};
  if (!user) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Non authentifié' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'GITHUB_TOKEN non configuré dans les variables Netlify' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const { method = 'GET', path, data } = body;
  if (!path) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'path requis' }) };
  }

  // Sécurité : uniquement les chemins de notre dépôt
  const cleanPath = path.replace(/^\//, '').split('?')[0];
  if (!cleanPath.startsWith(`repos/${REPO}/`)) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Accès refusé' }) };
  }

  const url = `https://api.github.com/${path.replace(/^\//, '')}`;

  const ghRes = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const text = await ghRes.text();
  return { statusCode: ghRes.status, headers: CORS, body: text };
};
