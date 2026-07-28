// Netlify Function: proxy for Netlify Identity admin API
// Only the super-admin email can call this.

const SUPER_ADMIN = 'chrisgbev2005@gmail.com';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const { identity, user } = context.clientContext || {};

  if (!user || user.email !== SUPER_ADMIN) {
    return {
      statusCode: 403,
      headers: CORS,
      body: JSON.stringify({ error: 'Accès refusé. Réservé à l\'administrateur principal.' }),
    };
  }

  if (!identity || !identity.token) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Service Identity non disponible.' }),
    };
  }

  const adminHeaders = {
    Authorization: `Bearer ${identity.token}`,
    'Content-Type': 'application/json',
  };

  // GET — liste des utilisateurs
  if (event.httpMethod === 'GET') {
    const res = await fetch(`${identity.url}/admin/users?per_page=50&sort=created_at&direction=desc`, {
      headers: adminHeaders,
    });
    const data = await res.json();
    return { statusCode: res.status, headers: CORS, body: JSON.stringify(data) };
  }

  // POST — inviter un utilisateur (avec renvoi automatique si déjà invité)
  if (event.httpMethod === 'POST') {
    const { email } = JSON.parse(event.body || '{}');
    if (!email) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email requis.' }) };
    }

    const invite = async () =>
      fetch(`${identity.url}/admin/users`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ email, send_invite: true }),
      });

    let res = await invite();

    // 422 = utilisateur déjà existant dans Identity
    if (res.status === 422) {
      // Retrouver l'utilisateur dans la liste
      const listRes = await fetch(`${identity.url}/admin/users?per_page=500`, { headers: adminHeaders });
      const listData = await listRes.json();
      const existing = (listData.users || []).find(u => u.email === email);

      if (existing && existing.confirmed_at) {
        // Compte déjà confirmé/actif — pas besoin de réinviter
        return {
          statusCode: 409,
          headers: CORS,
          body: JSON.stringify({ error: `${email} a déjà un compte actif sur ce site.` }),
        };
      }

      if (existing) {
        // Invitation en attente — supprimer et recréer pour renvoyer l'email
        await fetch(`${identity.url}/admin/users/${existing.id}`, { method: 'DELETE', headers: adminHeaders });
        res = await invite();
        const data = await res.json();
        return {
          statusCode: res.ok ? 200 : res.status,
          headers: CORS,
          body: JSON.stringify({ ...data, resent: true }),
        };
      }
    }

    const data = await res.json();
    return { statusCode: res.status, headers: CORS, body: JSON.stringify(data) };
  }

  // DELETE — supprimer un utilisateur
  if (event.httpMethod === 'DELETE') {
    const { userId } = JSON.parse(event.body || '{}');
    if (!userId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'userId requis.' }) };
    }
    const res = await fetch(`${identity.url}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    return { statusCode: res.status, headers: CORS, body: JSON.stringify({ success: res.ok }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Méthode non autorisée.' }) };
};
