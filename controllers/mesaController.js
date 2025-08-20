const Mesa = require("../models/Mesa");
const QRCode = require("qrcode");

// URL del frontend (fija a Vercel; si luego quieres ENV, se puede)
const FRONT_BASE = "https://bar-app-frontend-bar-client.vercel.app";

const crearMesa = async (req, res) => {
  try {
    let { numero } = req.body;

    if (numero === undefined || numero === null || numero === "") {
      return res.status(400).json({ error: "El número de mesa es obligatorio" });
    }
    numero = Number(numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ error: "El número de mesa debe ser un entero positivo" });
    }

    const existe = await Mesa.findOne({ numero });
    if (existe) return res.status(400).json({ msg: "La mesa ya existe" });

    // 1) Crear la mesa (sin QR aún)
    const mesa = await Mesa.create({ numero });

    // 2) Generar el QR apuntando al front /mesa/:id
    const urlMesa = `${FRONT_BASE.replace(/\/+$/, "")}/mesa/${mesa._id}`;

    try {
      const qrBase64 = await QRCode.toDataURL(urlMesa); // data:image/png;base64,...
      mesa.qrCode = qrBase64;
      await mesa.save();
    } catch (qrErr) {
      console.error("❌ Error generando QR:", qrErr?.message || qrErr);
      // Si prefieres forzar error cuando falle el QR, descomenta:
      // return res.status(500).json({ ok: false, msg: "No se pudo generar el QR" });
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Mesa creada",
      mesa,
    });
  } catch (error) {
    console.error("❌ Error al crear mesa:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al crear la mesa",
      detalle: error.message,
    });
  }
};

const obtenerMesas = async (_req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    return res.json(mesas);
  } catch (error) {
    console.error("❌ Error al obtener mesas:", error);
    return res.status(500).json({ ok: false, msg: "Error al obtener las mesas", detalle: error.message });
  }
};

const obtenerMesaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const mesa = await Mesa.findById(id);
    if (!mesa) return res.status(404).json({ ok: false, msg: "Mesa no encontrada" });
    return res.json(mesa);
  } catch (error) {
    console.error("❌ Error al obtener la mesa por id:", error);
    return res.status(500).json({ ok: false, msg: "Error al obtener la mesa", detalle: error.message });
  }
};

module.exports = { crearMesa, obtenerMesas, obtenerMesaPorId };
