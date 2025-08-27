// jobs/spotifyAutoCleanup.js
const axios = require("axios");
const SongRequest = require("../models/SongRequest");

// Normalizador simple para fallback por texto (por si la URI no coincide)
const norm = (s = "") =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/gi, " ").trim();

async function tick(state) {
  const { BASE_URL, fallbackText } = state;

  let resp;
  try {
    resp = await axios.get(`${BASE_URL}/api/music/playback/status`, { timeout: 8000 });
  } catch (e) {
    // No hay player o token caducado; salimos silenciosamente.
    return;
  }

  const st = resp?.data?.status;
  const item = st?.item;
  if (!item) return;

  const nowUri = item.uri;
  const nowTitle = item.name;
  const nowArtist = (item.artists || []).map((a) => a.name).join(", ");

  // primer ciclo: solo cachear
  if (!state.lastUri) {
    state.lastUri = nowUri;
    state.lastTitle = nowTitle;
    state.lastArtist = nowArtist;
    return;
  }

  // ¿cambió la canción?
  if (nowUri && state.lastUri && nowUri !== state.lastUri) {
    try {
      // 1) Borrar por URI anterior
      const resDel = await SongRequest.deleteMany({
        trackUri: state.lastUri,
      });

      // 2) Fallback por texto si no borró nada por URI (versiones distintas)
      if (fallbackText && resDel.deletedCount === 0) {
        const rt = norm(state.lastTitle);
        const ra = norm(state.lastArtist);
        const candidates = await SongRequest.find(
          { status: { $in: ["queued", "approved", "playing", "done"] } },
          { title: 1, artist: 1 }
        ).lean();

        const ids = candidates
          .filter((x) => {
            const nt = norm(x.title);
            const na = norm(x.artist);
            const titleOk = rt && (nt.includes(rt) || rt.includes(nt));
            const artistOk = !ra || na.includes(ra) || ra.includes(na);
            return titleOk && artistOk;
          })
          .map((x) => x._id);

        if (ids.length) {
          await SongRequest.deleteMany({ _id: { $in: ids } });
        }
      }
    } catch (e) {
      // Silencioso para no romper el loop
    }

    // Actualizar cache para el siguiente ciclo
    state.lastUri = nowUri;
    state.lastTitle = nowTitle;
    state.lastArtist = nowArtist;
  }
}

function start() {
  const enabled = String(process.env.MUSIC_AUTOCLEAN_ENABLED || "true").toLowerCase() === "true";
  if (!enabled) {
    console.log("♫ AutoCleanup deshabilitado (MUSIC_AUTOCLEAN_ENABLED=false)");
    return;
  }

  // Si no pones API_URL, usa localhost con el PORT actual.
  const BASE_URL =
    process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

  const pollMs = parseInt(process.env.MUSIC_AUTOCLEAN_POLL_MS || "5000", 10); // cada 5s
  const fallbackText =
    String(process.env.MUSIC_AUTOCLEAN_FALLBACK_TEXT || "true").toLowerCase() === "true";

  const state = {
    BASE_URL,
    lastUri: null,
    lastTitle: null,
    lastArtist: null,
    fallbackText,
  };

  setInterval(() => tick(state).catch(() => {}), pollMs);
  console.log(`♫ AutoCleanup activo cada ${pollMs}ms (fallbackTexto=${fallbackText})`);
}

module.exports = { start };
