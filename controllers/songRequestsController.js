const axios = require("axios");
const Session = require("../models/Session");
const SongRequest = require("../models/SongRequest");
const Settings = require("../models/Settings");

/* *Config (vía ENV, con defaults seguros) */
const MAX_PER_SESSION = parseInt(process.env.MUSIC_MAX_PER_SESSION || "5", 10);                 // cupo por sesión
const MAX_PER_HOUR = parseInt(process.env.MUSIC_MAX_PER_SESSION_PER_HOUR || "3", 10);          // rate limit por hora
const COOLDOWN_SECONDS = parseInt(process.env.MUSIC_COOLDOWN_SECONDS || "120", 10);            // enfriamiento entre requests por sesión
const ANTI_DUP_WINDOW_MIN = parseInt(process.env.MUSIC_ANTI_DUP_WINDOW_MIN || "30", 10);       // ventana anti-duplicados (min)
const MAX_QUEUE_SIZE = parseInt(process.env.MUSIC_MAX_QUEUE_SIZE || "30", 10);                 // tope global de cola
const BASE_URL = process.env.API_URL || "http://localhost:5000";                                // para llamar a tu propio backend

// Estados permitidos de una solicitud
const STATUS = {
  QUEUED: "queued",
  APPROVED: "approved",
  PLAYING: "playing",
  REJECTED: "rejected",
  DONE: "done",
};

const ACTIVE_IN_QUEUE = [STATUS.QUEUED, STATUS.APPROVED, STATUS.PLAYING];

/**  Helpers */

function normalizeTrackUri(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();

  if (s.startsWith("spotify:track:")) return s;

  if (/open\.spotify\.com\/track\//i.test(s)) {
    try {
      const url = new URL(s);
      const parts = url.pathname.split("/").filter(Boolean); // ["track", "<id>"]
      const id = parts[1];
      return id ? `spotify:track:${id}` : null;
    } catch {}
  }

  if (/^[A-Za-z0-9]+$/.test(s)) {
    return `spotify:track:${s}`;
  }

  return null;
}

async function findActiveSession({ sessionId, mesaId }) {
  if (sessionId) {
    const bySession = await Session.findOne({ sessionId, active: true });
    if (bySession) return bySession;
  }
  if (mesaId) {
    const byMesa = await Session.findOne({ mesa: mesaId, active: true });
    if (byMesa) return byMesa;
  }
  return null;
}

/** ===== Controller ===== */
module.exports = {
  async crearSolicitud(req, res) {
    try {
      const {
        sessionId,
        mesaId,
        trackUri: rawTrackUri,
        trackUrl,
        trackId,
        title,
        artist,
        imageUrl,
      } = req.body || {};

      // 1) Normalizar trackUri
      const trackUri =
        normalizeTrackUri(rawTrackUri) ||
        normalizeTrackUri(trackUrl) ||
        normalizeTrackUri(trackId);

      if (!trackUri) {
        return res
          .status(400)
          .json({ ok: false, msg: "trackUri/trackUrl/trackId inválido o ausente" });
      }

      if (!title || !artist) {
        return res
          .status(400)
          .json({ ok: false, msg: "'title' y 'artist' son obligatorios" });
      }

      // 2) Sesión activa requerida
      const session = await findActiveSession({ sessionId, mesaId });
      if (!session) {
        return res
          .status(404)
          .json({ ok: false, msg: "No hay sesión activa para esta mesa/sesión" });
      }

      // 3) Tope global de cola (queued+approved)
      const globalQueued = await SongRequest.countDocuments({
        status: { $in: [STATUS.QUEUED, STATUS.APPROVED] },
      });
      if (globalQueued >= MAX_QUEUE_SIZE) {
        return res
          .status(429)
          .json({ ok: false, msg: "La cola está llena. Intenta más tarde." });
      }

      // 4) Cupo por sesión (queued/approved/playing)
      const activeCount = await SongRequest.countDocuments({
        "requestedBy.sessionId": session.sessionId,
        status: { $in: ACTIVE_IN_QUEUE },
      });
      if (activeCount >= MAX_PER_SESSION) {
        return res.status(429).json({
          ok: false,
          msg: `Alcanzaste el máximo de ${MAX_PER_SESSION} solicitudes activas en esta sesión`,
        });
      }

      // 5) Rate limit por hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const hourCount = await SongRequest.countDocuments({
        "requestedBy.sessionId": session.sessionId,
        createdAt: { $gte: oneHourAgo },
      });
      if (hourCount >= MAX_PER_HOUR) {
        return res.status(429).json({
          ok: false,
          msg: `Máximo ${MAX_PER_HOUR} solicitudes por hora en esta sesión`,
        });
      }

      // 6) Cooldown
      const lastReq = await SongRequest.findOne({
        "requestedBy.sessionId": session.sessionId,
      })
        .sort({ createdAt: -1 })
        .select({ createdAt: 1 })
        .lean();

      if (lastReq?.createdAt) {
        const diffSec = Math.floor((Date.now() - new Date(lastReq.createdAt).getTime()) / 1000);
        if (diffSec < COOLDOWN_SECONDS) {
          return res.status(429).json({
            ok: false,
            msg: `Debes esperar ${COOLDOWN_SECONDS - diffSec}s antes de enviar otra solicitud`,
          });
        }
      }

      // 7) Anti-duplicados (misma sesión, misma canción) por ventana
      const dupSince = new Date(Date.now() - ANTI_DUP_WINDOW_MIN * 60 * 1000);
      const dupExists = await SongRequest.exists({
        "requestedBy.sessionId": session.sessionId,
        trackUri,
        createdAt: { $gte: dupSince },
        status: { $nin: [STATUS.REJECTED, STATUS.DONE] },
      });
      if (dupExists) {
        return res.status(409).json({
          ok: false,
          msg: "Ya pediste esta canción recientemente en esta sesión",
        });
      }

      // 8) Verificar que exista un device preferido (PC del bar)
      const settings = await Settings.findOne({});
      if (!settings?.preferredDeviceId) {
        return res.status(409).json({
          ok: false,
          msg: "No hay dispositivo preferido configurado en el PC del bar. Selecciónalo en /api/settings/device.",
        });
      }

      // 9) Crear solicitud en DB
      const doc = await SongRequest.create({
        trackUri,
        title: String(title).trim(),
        artist: String(artist).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
        requestedBy: {
          sessionId: session.sessionId,
          mesaId: session.mesa,
        },
        status: STATUS.QUEUED,
        votes: 0,
      });

      // 10) Intentar encolar inmediatamente en Spotify
      try {
        await axios.post(
          `${BASE_URL}/api/music/playback/queue`,
          { uri: trackUri, deviceId: settings.preferredDeviceId },
          { headers: { "Content-Type": "application/json" } }
        );
        // Si quieres marcar algo adicional en el doc cuando sí se encola, puedes actualizar aquí.
        // await SongRequest.findByIdAndUpdate(doc._id, { queuedAt: new Date() });
        return res.status(201).json({ ok: true, msg: "Añadida a la cola del bar", request: doc });
      } catch (e) {
        // Si falla (sin device activo/token), dejamos la solicitud creada y avisamos
        console.error("[crearSolicitud] queue failed:", e?.response?.data || e.message);
        return res.status(202).json({
          ok: true,
          msg: "Solicitud guardada, pero el reproductor no está activo. Actívalo en el PC del bar y reintenta.",
          request: doc,
        });
      }
    } catch (err) {
      console.error("[crearSolicitud] Error:", err?.message || err);
      return res.status(500).json({ ok: false, msg: "Error al crear solicitud" });
    }
  },

  /**
   * GET /api/music/requests
   * Query: status?, sessionId?, mesaId?, limit?, page?, sort? (createdAt|votes ASC/DESC)
   */
  async listarSolicitudes(req, res) {
    try {
      const {
        status,
        sessionId,
        mesaId,
        limit = 50,
        page = 1,
        sort = "createdAt:asc", // opciones: createdAt:asc|desc, votes:asc|desc
      } = req.query;

      const filter = {};
      if (status) {
        const arr = String(status)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (arr.length) filter.status = { $in: arr };
      }
      if (sessionId) filter["requestedBy.sessionId"] = String(sessionId);
      if (mesaId) filter["requestedBy.mesaId"] = String(mesaId);

      const [sortField, sortDirRaw] = String(sort).split(":");
      const sortDir = sortDirRaw?.toLowerCase() === "desc" ? -1 : 1;
      const sortObj = { [sortField || "createdAt"]: sortDir };

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

      const [items, total] = await Promise.all([
        SongRequest.find(filter).sort(sortObj).limit(limitNum).skip((pageNum - 1) * limitNum),
        SongRequest.countDocuments(filter),
      ]);

      return res.json({ ok: true, total, page: pageNum, limit: limitNum, items });
    } catch (err) {
      console.error("[listarSolicitudes] Error:", err?.message || err);
      return res.status(500).json({ ok: false, msg: "Error al listar solicitudes" });
    }
  },

  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body || {};

      const allowed = new Set([STATUS.APPROVED, STATUS.REJECTED, STATUS.PLAYING, STATUS.DONE]);
      if (!allowed.has(status)) {
        return res.status(400).json({
          ok: false,
          msg: `Estado inválido. Usa uno de: ${Array.from(allowed).join(", ")}`,
        });
      }

      const update = { status };
      if (status === STATUS.PLAYING) update.playedAt = new Date();
      if (status === STATUS.REJECTED) update.rejectedReason = reason ? String(reason).trim() : "—";

      const doc = await SongRequest.findByIdAndUpdate(id, update, { new: true });
      if (!doc) return res.status(404).json({ ok: false, msg: "Solicitud no encontrada" });

      return res.json({ ok: true, request: doc });
    } catch (err) {
      console.error("[actualizarEstado] Error:", err?.message || err);
      return res.status(500).json({ ok: false, msg: "Error al actualizar estado" });
    }
  },

  /**
   * POST /api/music/requests/:id/vote
   * Body: { delta?: number }  // default +1
   */
  async votar(req, res) {
    try {
      const { id } = req.params;
      const delta = Number.isFinite(Number(req.body?.delta)) ? Number(req.body.delta) : 1;

      const doc = await SongRequest.findByIdAndUpdate(
        id,
        { $inc: { votes: delta } },
        { new: true }
      );
      if (!doc) return res.status(404).json({ ok: false, msg: "Solicitud no encontrada" });

      return res.json({ ok: true, request: doc });
    } catch (err) {
      console.error("[votar] Error:", err?.message || err);
      return res.status(500).json({ ok: false, msg: "Error al votar" });
    }
  },

  /**
   * DELETE /api/music/requests/:id
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const doc = await SongRequest.findByIdAndDelete(id);
      if (!doc) return res.status(404).json({ ok: false, msg: "Solicitud no encontrada" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("[eliminar] Error:", err?.message || err);
      return res.status(500).json({ ok: false, msg: "Error al eliminar solicitud" });
    }
  },
};
