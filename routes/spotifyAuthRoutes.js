// routes/spotifyAuthRoutes.js
const router = require('express').Router();
const axios = require('axios');
const { setTokens, getTokens } = require('../services/spotifyTokenStore');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const SCOPES = [
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
].join(' ');

// GET /api/music/spotify/login
router.get('/login', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: req.query.state || 'barapp',
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// GET /api/music/spotify/callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send(`Error de Spotify: ${error}`);
  if (!code) return res.status(400).send('Falta parámetro code');

  try {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const { data } = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: { Authorization: `Basic ${basic}` },
    });

    // 🔴 Clave: guardar en el store compartido
    setTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
    });

    console.log('✅ Tokens guardados:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in,
    });

    res.send('✅ Spotify conectado. Ya puedes cerrar esta ventana.');
  } catch (e) {
    res.status(500).send(`Fallo al intercambiar code: ${e.response?.data?.error_description || e.message}`);
  }
});

// (Opcional) GET /api/music/spotify/status
router.get('/status', (req, res) => {
  const t = getTokens();
  res.json({
    ok: true,
    hasAccessToken: !!t.accessToken,
    hasRefreshToken: !!t.refreshToken,
    expiresAt: t.expiresAt,
    scope: t.scope,
  });
});

module.exports = router;
