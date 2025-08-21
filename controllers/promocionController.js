const Promocion = require("../models/Promociones");

const parseBoolean = (val) => {
  if (val === undefined) return undefined;
  if (typeof val === "boolean") return val;
  const s = String(val).toLowerCase();
  return s === "true" || s === "1";
};

module.exports = {
  async crearPromocion(req, res) {
    try {
      const { titulo, descripcion, imagenUrl, activa, inicia, termina, orden } = req.body;
      if (!titulo || !imagenUrl) {
        return res.status(400).json({ error: "'titulo' e 'imagenUrl' son obligatorios" });
      }
      const doc = await Promocion.create({
        titulo: String(titulo).trim(),
        descripcion: descripcion ? String(descripcion).trim() : undefined,
        imagenUrl: String(imagenUrl).trim(),
        activa: parseBoolean(activa) ?? true,
        inicia: inicia ? new Date(inicia) : undefined,
        termina: termina ? new Date(termina) : undefined,
        orden: typeof orden === "number" ? orden : 0,
      });
      return res.status(201).json(doc);
    } catch (err) {
      console.error("[crearPromocion]", err?.message || err);
      return res.status(500).json({ error: "Error al crear la promoción" });
    }
  },

  async listarPromociones(req, res) {
    try {
      const { activeNow, activa, limit = 50, page = 1 } = req.query;
      const filter = {};
      const activaParsed = parseBoolean(activa);
      if (activaParsed !== undefined) filter.activa = activaParsed;

      if (parseBoolean(activeNow)) {
        const now = new Date();
        filter.activa = true;
        filter.$and = [
          { $or: [{ inicia: { $lte: now } }, { inicia: { $exists: false } }, { inicia: null }] },
          { $or: [{ termina: { $gte: now } }, { termina: { $exists: false } }, { termina: null }] },
        ];
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

      const items = await Promocion.find(filter)
        .sort({ orden: 1, createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean()
        .exec();

      const total = await Promocion.countDocuments(filter).exec();

      return res.json({ ok: true, total, page: pageNum, limit: limitNum, items });
    } catch (err) {
      console.error("[listarPromociones]", err?.message || err);
      return res.status(500).json({ error: "Error al listar promociones" });
    }
  },

  async obtenerPromocion(req, res) {
    try {
      const doc = await Promocion.findById(req.params.id).lean().exec();
      if (!doc) return res.status(404).json({ error: "Promoción no encontrada" });
      return res.json(doc);
    } catch (err) {
      console.error("[obtenerPromocion]", err?.message || err);
      return res.status(500).json({ error: "Error al obtener la promoción" });
    }
  },

  async actualizarPromocion(req, res) {
    try {
      const b = req.body;
      const update = {};
      if (b.titulo !== undefined) update.titulo = String(b.titulo).trim();
      if (b.descripcion !== undefined) update.descripcion = String(b.descripcion).trim();
      if (b.imagenUrl !== undefined) update.imagenUrl = String(b.imagenUrl).trim();
      if (b.activa !== undefined) update.activa = parseBoolean(b.activa);
      if (b.inicia !== undefined) update.inicia = b.inicia ? new Date(b.inicia) : null;
      if (b.termina !== undefined) update.termina = b.termina ? new Date(b.termina) : null;
      if (b.orden !== undefined) update.orden = Number(b.orden);

      const doc = await Promocion.findByIdAndUpdate(req.params.id, update, { new: true }).exec();
      if (!doc) return res.status(404).json({ error: "Promoción no encontrada" });
      return res.json(doc);
    } catch (err) {
      console.error("[actualizarPromocion]", err?.message || err);
      return res.status(500).json({ error: "Error al actualizar la promoción" });
    }
  },

  async eliminarPromocion(req, res) {
    try {
      const doc = await Promocion.findByIdAndDelete(req.params.id).exec();
      if (!doc) return res.status(404).json({ error: "Promoción no encontrada" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("[eliminarPromocion]", err?.message || err);
      return res.status(500).json({ error: "Error al eliminar la promoción" });
    }
  },
};
