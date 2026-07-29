// Auto-détection du live YouTube — CEFC Alost
// Env var requise : YOUTUBE_API_KEY (Netlify Site settings > Environment)

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 min en mémoire

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, s-maxage=180', // CDN cache 3 min
};

exports.handler = async () => {
  // Cache mémoire (instances chaudes)
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(_cache) };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ isLive: false, noKey: true }),
    };
  }

  const CHANNEL_ID = 'UCp4V6MSF87MGlw87fPdl-sg';

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id,snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKey}`
    );
    const data = await res.json();

    const isLive = Array.isArray(data.items) && data.items.length > 0;
    const videoId = isLive ? data.items[0].id.videoId : null;
    const title   = isLive ? data.items[0].snippet.title : null;

    _cache = { isLive, videoId, title };
    _cacheTime = Date.now();

    return { statusCode: 200, headers: CORS, body: JSON.stringify(_cache) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ isLive: false }) };
  }
};
