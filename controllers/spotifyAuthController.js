// controllers/spotifyAuthController.js
// Flujo OAuth para conectar la cuenta de Spotify del bar.
// Requiere en .env:
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REDIRECT_URI   (debe coincidir EXACTO con el registrado en Spotify Developers)
// Opcional en .env:
//   SPOTIFY_SCOPES="user-read-playback-state user-modify-playback-state user-read-currently-playing"
//   SPOTIFY_FRONTEND_SUCCESS_URL="http://localhost:3000/integraciones/spotify/success"
//   SPOTIFY_FRONTEND_ERROR_URL="http://localhost:3000/integraciones/spotify/error"

const BASE_AUTH = "https://accounts.spotify.com";
const TOKEN_URL = `${BASE_AUTH}/api/token`;
const AUTHORIZE_URL = `${BASE_AUTH}/authorize`;

let _oauth = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0, // epoch ms
};

const _pendingStates = new Set();

function requireEnv(...keys) {
  for (const k of keys) {
    if (!process.env[k]) throw new Error(`Falta variable de entorno: ${k}`);
  }
}

function genState() {
  // state anti-CSRF simple
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function now() {
  return Date.now();
}

function getScopes() {
  const def =
    "user-read-playback-state user-modify-playback-state user-read-currently-playing";
  return (process.env.SPOTIFY_SCOPES || def)
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

async function exchangeCodeForTokens(code) {
  requireEnv("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REDIRECT_URI");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Spotify token error (${resp.status}): ${txt}`);
  }

  const data = await resp.json();
  _oauth.accessToken = data.access_token;
  _oauth.refreshToken = data.refresh_token || _oauth.refreshToken; // a veces Spotify no re-envía refresh en re-consent
  _oauth.expiresAt = now() + (data.expires_in || 3600) * 1000;
}

async function refreshAccessToken() {
  requireEnv("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET");

  if (!_oauth.refreshToken) throw new Error("No hay refresh_token almacenado");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: _oauth.refreshToken,
  });

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Spotify refresh error (${resp.status}): ${txt}`);
  }

  const data = await resp.json();
  _oauth.accessToken = data.access_token;
  _oauth.expiresAt = now() + (data.expires_in || 3600) * 1000;
  if (data.refresh_token) {
    // en ocasiones Spotify devuelve nuevo refresh_token
    _oauth.refreshToken = data.refresh_token;
  }
}

/**
 * Devuelve un access token válido (lo refresca si es necesario).
 * Exportado para usar en otros controllers
 */
async function getAccessToken() {
  if (_oauth.accessToken && now() < _oauth.expiresAt - 30_000) {
    return _oauth.accessToken;
  }
  await refreshAccessToken();
  return _oauth.accessToken;
}

/**
 * GET /api/music/spotify/login
 * Redirige al consentimiento de Spotify.
 */
async function login(req, res) {
  try {
    requireEnv("SPOTIFY_CLIENT_ID", "SPOTIFY_REDIRECT_URI");

    const state = genState();
    _pendingStates.add(state);

    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      scope: getScopes(),
      state,
      // show_dialog: "true", // descomenta si quieres forzar el diálogo cada vez
    });

    return res.redirect(`${AUTHORIZE_URL}?${params.toString()}`);
  } catch (err) {
    console.error("[spotifyAuthController.login]", err?.message || err);
    return res.status(500).json({ ok: false, msg: "Error iniciando login de Spotify" });
  }
}

/**
 * GET /api/music/spotify/callback?code=...&state=...
 * Intercambia el code por tokens y finaliza el flujo.
 */
async function callback(req, res) {
  try {
    const { code, state, error } = req.query || {};

    if (error) {
      const to = process.env.SPOTIFY_FRONTEND_ERROR_URL;
      if (to) return res.redirect(`${to}?error=${encodeURIComponent(String(error))}`);
      return res
        .status(400)
        .send(`<h2>Spotify error: ${String(error)}</h2>`);
    }

    if (!code || !state || !_pendingStates.has(state)) {
      return res.status(400).send("<h2>Callback inválido: falta code/state o state no coincide</h2>");
    }
    _pendingStates.delete(state);

    await exchangeCodeForTokens(String(code));

    const to = process.env.SPOTIFY_FRONTEND_SUCCESS_URL;
    if (to) return res.redirect(to);

    return res
      .status(200)
      .send("<h2>✅ Spotify conectado. Ya puedes cerrar esta pestaña.</h2>");
  } catch (err) {
    console.error("[spotifyAuthController.callback]", err?.message || err);
    const to = process.env.SPOTIFY_FRONTEND_ERROR_URL;
    if (to) return res.redirect(`${to}?error=${encodeURIComponent("callback_failed")}`);
    return res.status(500).send("<h2>❌ Error finalizando conexión con Spotify</h2>");
  }
}

/**
 * GET /api/music/spotify/status
 * Responde si hay refresh_token guardado (conectado).
 */
async function status(_req, res) {
  try {
    const connected = !!_oauth.refreshToken;
    const willExpireIn =
      _oauth.accessToken && _oauth.expiresAt
        ? Math.max(0, Math.floor((_oauth.expiresAt - now()) / 1000))
        : null;

    return res.json({
      ok: true,
      connected,
      accessTokenExpiresIn: willExpireIn,
    });
  } catch (err) {
    console.error("[spotifyAuthController.status]", err?.message || err);
    return res.status(500).json({ ok: false, connected: false });
  }
}

/**
 * (Opcional) Para desarrollo: limpiar tokens en memoria.
 */
async function _devReset(_req, res) {
  _oauth = { accessToken: null, refreshToken: null, expiresAt: 0 };
  return res.json({ ok: true });
}

module.exports = {
  // handlers http
  login,
  callback,
  status,

  // helpers para otros módulos
  getAccessToken,
  // util de desarrollo
  _devReset,
};
