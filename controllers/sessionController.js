// controllers/sessionController.js
const crypto = require("crypto");
const Session = require("../models/Session");
const Mesa = require("../models/Mesa");

const startOrGetSession = async (req, res) => {
  try {
    const { mesaId } = req.body;
    if (!mesaId) return res.status(400).json({ ok: false, msg: "mesaId es obligatorio" });

    const mesa = await Mesa.findById(mesaId);
    if (!mesa) return res.status(404).json({ ok: false, msg: "Mesa no encontrada" });

    let session = await Session.findOne({ mesa: mesaId, active: true });
    if (!session) {
      session = await Session.create({
        mesa: mesaId,
        sessionId: crypto.randomUUID(),
        active: true,
        startedAt: new Date(),
      });
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

    session.active = false;
    session.closedAt = new Date();
    await session.save();

    return res.json({ ok: true, session });
  } catch (error) {
    console.error("❌ Error al cerrar sesión:", error);
    return res.status(500).json({ ok: false, msg: "Error al cerrar sesión", detalle: error.message });
  }
};

module.exports = { startOrGetSession, getActiveByMesa, closeSession };
