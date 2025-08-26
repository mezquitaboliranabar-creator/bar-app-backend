// controllers/musicSearchController.js
// Busca canciones en Spotify usando Client Credentials (sin involucrar al usuario del bar).
// Requiere Node 18+ (fetch nativo). Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
// Opcional: SPOTIFY_SEARCH_MARKET (p. ej. "CO" o "US")

const BASE_AUTH = "https://accounts.spotify.com/api/token";
const BASE_API = "https://api.spotify.com/v1";

let _appToken = null;
let _expiresAt = 0;

/** Obtiene y cachea el app token de Spotify (Client Credentials) */
async function getAppToken() {
  const now = Date.now();
  if (_appToken && now < _expiresAt - 60_000) {
    return _appToken;
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const resp = await fetch(BASE_AUTH, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Spotify auth failed (${resp.status}): ${txt}`);
  }
  const data = await resp.json();
  _appToken = data.access_token;
  _expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return _appToken;
}

/** Normaliza un track de Spotify a formato simple para el frontend */
function mapTrack(item) {
  const images = item?.album?.images || [];
  const img =
    images.find((i) => i.height >= 300) ||
    images[0] ||
    null;

  return {
    trackId: item?.id || null,
    trackUri: item?.uri || (item?.id ? `spotify:track:${item.id}` : null),
    title: item?.name || "",
    artist: (item?.artists || []).map((a) => a.name).join(", "),
    album: item?.album?.name || "",
    imageUrl: img?.url || "",
    durationMs: item?.duration_ms ?? null,
    previewUrl: item?.preview_url || null,
    explicit: !!item?.explicit,
  };
}

module.exports = {
  /**
   * GET /api/music/search?q=termino&limit=10&offset=0[&market=CO]
   * Devuelve: { ok, total, items: [{ trackUri, title, artist, imageUrl, ... }] }
   */
  async searchTracks(req, res) {
    try {
      const q = String(req.query?.q || "").trim();
      if (!q) {
        return res.status(400).json({ ok: false, msg: "Parámetro 'q' es obligatorio" });
      }
      const limit = Math.min(25, Math.max(1, parseInt(req.query?.limit, 10) || 10));
      const offset = Math.max(0, parseInt(req.query?.offset, 10) || 0);

      // ✅ NO usar "from_token" con Client Credentials; permitir market por query o .env
      const market = String(
        (req.query?.market ?? process.env.SPOTIFY_SEARCH_MARKET ?? "")
      ).trim().toUpperCase();

      const token = await getAppToken();
      const params = new URLSearchParams({
        q,
        type: "track",
        limit: String(limit),
        offset: String(offset),
      });
      if (market) params.set("market", market); // p. ej. "CO" o "US"

      const resp = await fetch(`${BASE_API}/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        return res
          .status(resp.status)
          .json({ ok: false, msg: `Spotify error ${resp.status}`, detail: txt });
      }

      const data = await resp.json();
      const tracks = data?.tracks?.items || [];
      const total = data?.tracks?.total || 0;

      const items = tracks.map(mapTrack);
      return res.json({ ok: true, total, items });
    } catch (err) {
      console.error("[musicSearchController.searchTracks]", err?.message || err);
      return res.status(500).json({ ok: false, msg: "Error al buscar canciones" });
    }
  },
};
