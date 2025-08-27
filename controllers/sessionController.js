// controllers/sessionController.js
const crypto = require("crypto");
const Session = require("../models/Session");
const Mesa = require("../models/Mesa");

const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 5);
const ABSOLUTE_MINUTES = Number(process.env.SESSION_ABSOLUTE_MAX_MINUTES || 0); // 0 = deshabilitado

const nowMs = () => Date.now();
const ms = (m) => m * 60 * 1000;

/* ==== NUEVO: helpers para sincronizar estado de la mesa ==== */
async function setMesaEstado(mesaId, estado) {
  try {
    await Mesa.findByIdAndUpdate(mesaId, { estado }, { new: false });
  } catch (e) {
    console.warn("⚠️ No se pudo actualizar estado de mesa:", mesaId, e?.message);
  }
}
async function setMesaLibreSiNoHaySesiones(mesaId) {
  try {
    const stillActive = await Session.exists({ mesa: mesaId, active: true });
    if (!stillActive) await setMesaEstado(mesaId, "libre");
  } catch (e) {
    console.warn("⚠️ No se pudo verificar sesiones activas para mesa:", mesaId, e?.message);
  }
}
/* ========================================================== */

function isExpiredByIdle(session) {
  const last = new Date(session.lastActivityAt || session.startedAt || Date.now()).getTime();
  return nowMs() - last > ms(IDLE_MINUTES);
}
function isExpiredByAbsolute(session) {
  if (!ABSOLUTE_MINUTES) return false;
  const start = new Date(session.startedAt || Date.now()).getTime();
  return nowMs() - start > ms(ABSOLUTE_MINUTES);
}
async function closeAndSave(session, reason) {
  session.active = false;
  session.closedAt = new Date();
  session.closedReason = reason || null;
  await session.save();
  // ✅ al cerrar/expirar, si no quedan sesiones activas, dejar mesa en "libre"
  await setMesaLibreSiNoHaySesiones(session.mesa);
}

// Crea o reutiliza sesión (con expiración perezosa)
const startOrGetSession = async (req, res) => {
  try {
    const { mesaId } = req.body;
    if (!mesaId) return res.status(400).json({ ok: false, msg: "mesaId es obligatorio" });

    const mesa = await Mesa.findById(mesaId);
    if (!mesa) return res.status(404).json({ ok: false, msg: "Mesa no encontrada" });

    let session = await Session.findOne({ mesa: mesaId, active: true });

    if (session) {
      // Si existe, valida expiración; si expiró, ciérrala y crea una nueva
      if (isExpiredByIdle(session)) {
        await closeAndSave(session, "idle");
        session = null;
      } else if (isExpiredByAbsolute(session)) {
        await closeAndSave(session, "absolute");
        session = null;
      } else {
        // viva → refresca actividad y devuelve
        session.lastActivityAt = new Date();
        await session.save();
        // ✅ asegura estado "ocupada" mientras haya sesión activa
        await setMesaEstado(mesaId, "ocupada");
        return res.status(201).json({ ok: true, session });
      }
    }

    if (!session) {
      session = await Session.create({
        mesa: mesaId,
        sessionId: crypto.randomUUID(),
        active: true,
        startedAt: new Date(),
        lastActivityAt: new Date(),
      });
      // ✅ nueva sesión → mesa ocupada
      await setMesaEstado(mesaId, "ocupada");
    }

    return res.status(201).json({ ok: true, session });
  } catch (error) {
    if (error?.code === 11000) {
      const again = await Session.findOne({ mesa: req.body.mesaId, active: true });
      if (again) return res.json({ ok: true, session: again });
    }
    console.error("❌ Error al iniciar/obtener sesión:", error);
    return res.status(500).json({ ok: false, msg: "Error al iniciar sesión", detalle: error.message });
  }
};

const getActiveByMesa = async (req, res) => {
  try {
    const { mesaId } = req.params;
    const session = await Session.findOne({ mesa: mesaId, active: true });
    if (!session) return res.status(404).json({ ok: false, msg: "No hay sesión activa" });

    if (isExpiredByIdle(session)) {
      await closeAndSave(session, "idle");
      return res.status(404).json({ ok: false, code: "SESSION_EXPIRED", msg: "Sesión expirada por inactividad" });
    }
    if (isExpiredByAbsolute(session)) {
      await closeAndSave(session, "absolute");
      return res.status(404).json({ ok: false, code: "SESSION_EXPIRED", msg: "Sesión expirada (límite máximo)" });
    }

    // refresca actividad si quieres que 'get' también cuente como actividad:
    session.lastActivityAt = new Date();
    await session.save();
    // ✅ mientras esté viva, marcar mesa como ocupada
    await setMesaEstado(mesaId, "ocupada");

    return res.json({ ok: true, session });
  } catch (error) {
    console.error("❌ Error al obtener sesión:", error);
    return res.status(500).json({ ok: false, msg: "Error al obtener sesión", detalle: error.message });
  }
};

const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId, active: true });
    if (!session) return res.status(404).json({ ok: false, msg: "Sesión no encontrada o ya cerrada" });

    await closeAndSave(session, "manual");
    return res.json({ ok: true, session });
  } catch (error) {
    console.error("❌ Error al cerrar sesión:", error);
    return res.status(500).json({ ok: false, msg: "Error al cerrar sesión", detalle: error.message });
  }
};

// ✅ NUEVO: ping/heartbeat para mantener viva una sesión mientras el cliente está en la página
const ping = async (req, res) => {
  try {
    // admite body.sessionId o :sessionId
    const sessionId = req.params.sessionId || req.body.sessionId;
    if (!sessionId) return res.status(400).json({ ok: false, msg: "sessionId es obligatorio" });

    const session = await Session.findOne({ sessionId, active: true });
    if (!session) return res.status(404).json({ ok: false, code: "NOT_FOUND", msg: "Sesión no activa" });

    if (isExpiredByIdle(session)) {
      await closeAndSave(session, "idle");
      return res.status(410).json({ ok: false, code: "SESSION_EXPIRED", msg: "Sesión expirada por inactividad" });
    }
    if (isExpiredByAbsolute(session)) {
      await closeAndSave(session, "absolute");
      return res.status(410).json({ ok: false, code: "SESSION_EXPIRED", msg: "Sesión expirada (límite máximo)" });
    }

    session.lastActivityAt = new Date();
    await session.save();
    // ✅ ping exitoso → mantener mesa ocupada
    await setMesaEstado(session.mesa, "ocupada");

    const until = new Date(session.lastActivityAt).getTime() + ms(IDLE_MINUTES);
    return res.json({ ok: true, until });
  } catch (error) {
    console.error("❌ Error en ping:", error);
    return res.status(500).json({ ok: false, msg: "Error en ping", detalle: error.message });
  }
};

module.exports = { startOrGetSession, getActiveByMesa, closeSession, ping };
