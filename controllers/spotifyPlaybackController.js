// controllers/spotifyPlaybackController.js
const axios = require('axios');
const {
  setTokens,
  getAccessToken,
  getRefreshToken,
  isExpired,
} = require('../services/spotifyTokenStore');

// 1) Helper: manejador de errores para rutas async
function wrap(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((e) => {
      const status = e?.response?.status || 500;
      res
        .status(status)
        .json({ ok: false, error: e?.response?.data || e.message });
    });
}

// 2) Refresco de token (declaración de función => hoisted, sin problemas de orden)
async function refreshAccessTokenIfNeeded(force = false) {
  const need = force || isExpired();
  if (!need) return getAccessToken();

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No hay refresh_token para renovar el access_token');
  }

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    params,
    { headers: { Authorization: `Basic ${basic}` } }
  );

  setTokens({
    access_token: data.access_token,
    expires_in: data.expires_in,
    scope: data.scope,
  });

  return getAccessToken();
}

// 3) Helper de request a Spotify con reintento en 401
async function spotifyRequest(method, url, { params, data, deviceId } = {}) {
  await refreshAccessTokenIfNeeded(false);

  const call = async () =>
    axios({
      method,
      url: `https://api.spotify.com/v1${url}`,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      params: { ...(params || {}), ...(deviceId ? { device_id: deviceId } : {}) },
      data,
    });

  try {
    return await call();
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await refreshAccessTokenIfNeeded(true);
      return await call();
    }
    throw err;
  }
}

// 4) Handlers
const listDevices = wrap(async (req, res) => {
  const { data } = await spotifyRequest('get', '/me/player/devices');
  res.json({ ok: true, devices: data.devices });
});

const selectDevice = wrap(async (req, res) => {
  const { deviceId, play = true } = req.body || {};
  if (!deviceId)
    return res.status(400).json({ ok: false, msg: 'deviceId es requerido' });
  await spotifyRequest('put', '/me/player', {
    data: { device_ids: [deviceId], play: !!play },
  });
  res.json({ ok: true, msg: 'Dispositivo seleccionado' });
});

const play = wrap(async (req, res) => {
  const { deviceId, context_uri, uris, offset, position_ms } = req.body || {};
  const payload = {};
  if (context_uri) payload.context_uri = context_uri; // ej: spotify:playlist:...
  if (uris) payload.uris = uris; // ['spotify:track:...']
  if (offset) payload.offset = offset; // { position: N } o { uri: 'spotify:track:...' }
  if (typeof position_ms === 'number') payload.position_ms = position_ms;
  await spotifyRequest('put', '/me/player/play', { data: payload, deviceId });
  res.json({ ok: true, msg: 'Reproduciendo' });
});

const pause = wrap(async (req, res) => {
  const { deviceId } = req.body || {};
  await spotifyRequest('put', '/me/player/pause', { deviceId });
  res.json({ ok: true, msg: 'Pausado' });
});

const nextTrack = wrap(async (req, res) => {
  const { deviceId } = req.body || {};
  await spotifyRequest('post', '/me/player/next', { deviceId });
  res.json({ ok: true, msg: 'Siguiente' });
});

const previousTrack = wrap(async (req, res) => {
  const { deviceId } = req.body || {};
  await spotifyRequest('post', '/me/player/previous', { deviceId });
  res.json({ ok: true, msg: 'Anterior' });
});

const setVolume = wrap(async (req, res) => {
  const { deviceId, volumePercent } = req.body || {};
  if (typeof volumePercent !== 'number' || volumePercent < 0 || volumePercent > 100) {
    return res
      .status(400)
      .json({ ok: false, msg: 'volumePercent debe ser 0..100' });
  }
  await spotifyRequest('put', '/me/player/volume', {
    params: { volume_percent: volumePercent },
    deviceId,
  });
  res.json({ ok: true, msg: 'Volumen actualizado' });
});

const addToQueue = wrap(async (req, res) => {
  const { uri, deviceId } = req.body || {};
  if (!uri)
    return res
      .status(400)
      .json({ ok: false, msg: 'uri (spotify:track:...) es requerido' });
  await spotifyRequest('post', '/me/player/queue', {
    params: { uri },
    deviceId,
  });
  res.json({ ok: true, msg: 'Canción añadida a la cola' });
});

const status = wrap(async (req, res) => {
  const { data } = await spotifyRequest('get', '/me/player');
  res.json({ ok: true, status: data });
});

const getQueue = wrap(async (req, res) => {
  const { data } = await spotifyRequest('get', '/me/player/queue');
  res.json({ ok: true, queue: data });
});

// 5) Export
module.exports = {
  listDevices,
  selectDevice,
  play,
  pause,
  nextTrack,
  previousTrack,
  setVolume,
  addToQueue,
  status,
  getQueue,
  refreshAccessTokenIfNeeded, // opcional para otros módulos
};
