// middlewares/sessionGuard.js
const Session = require("../models/Session");

const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 5);
const ABSOLUTE_MINUTES = Number(process.env.SESSION_ABSOLUTE_MAX_MINUTES || 0);
const ms = (m) => m * 60 * 1000;
const nowMs = () => Date.now();

function isExpiredByIdle(session) {
  const last = new Date(session.lastActivityAt || session.startedAt || Date.now()).getTime();
  return nowMs() - last > ms(IDLE_MINUTES);
}
function isExpiredByAbsolute(session) {
  if (!ABSOLUTE_MINUTES) return false;
  const start = new Date(session.startedAt || Date.now()).getTime();
  return nowMs() - start > ms(ABSOLUTE_MINUTES);
}

async function requireActiveSession(req, res, next) {
  try {
    // Acepta sessionId en header, body o query
    const sessionId =
      req.headers["x-session-id"] ||
      req.body?.sessionId ||
      req.query?.sessionId;

    if (!sessionId) {
      return res.status(401).json({ ok: false, code: "NO_SESSION", msg: "Falta sessionId" });
    }

    const session = await Session.findOne({ sessionId, active: true });
    if (!session) {
      return res.status(403).json({ ok: false, code: "SESSION_INVALID", msg: "Sesión inválida o cerrada" });
    }

    if (isExpiredByIdle(session)) {
      session.active = false;
      session.closedAt = new Date();
      session.closedReason = "idle";
      await session.save();
      return res.status(410).json({ ok: false, code: "SESSION_EXPIRED", msg: "Sesión expirada por inactividad" });
    }
    if (isExpiredByAbsolute(session)) {
      session.active = false;
      session.closedAt = new Date();
      session.closedReason = "absolute";
      await session.save();
      return res.status(410).json({ ok: false, code: "SESSION_EXPIRED", msg: "Sesión expirada (límite máximo)" });
    }

    // Sesión válida → refresca actividad
    session.lastActivityAt = new Date();
    await session.save();

    req.session = session; // por si el controlador lo quiere usar
    return next();
  } catch (err) {
    console.error("❌ requireActiveSession:", err);
    return res.status(500).json({ ok: false, msg: "Error validando sesión" });
  }
}

module.exports = { requireActiveSession };
