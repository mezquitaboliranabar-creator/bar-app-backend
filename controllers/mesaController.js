// controllers/mesaController.js
const Mesa = require("../models/Mesa");
const QRCode = require("qrcode");

const FRONT_BASE = (process.env.FRONTEND_URL || "").replace(/\/+$/, ""); // sin trailing slash

const crearMesa = async (req, res) => {
  try {
    let { numero } = req.body;

    if (numero === undefined || numero === null || numero === "") {
      return res.status(400).json({ ok: false, error: "El número de mesa es obligatorio" });
    }
    numero = Number(numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ ok: false, error: "El número de mesa debe ser un entero positivo" });
    }

    const existe = await Mesa.findOne({ numero });
    if (existe) return res.status(400).json({ ok: false, msg: "La mesa ya existe" });

    // 1) Crear la mesa
    const mesa = await Mesa.create({ numero, estado: "libre" }); // estado opcional si tu schema no tiene default

    // 2) Construir URL del front /mesa/:id (usa _id, NO numero)
    if (!FRONT_BASE) {
      console.warn("⚠️ FRONTEND_URL no definido. Usando dominio placeholder.");
    }
    const base = FRONT_BASE || "https://bar-app-frontend-bar-client.vercel.app";
    const urlMesa = `${base}/mesa/${mesa._id}`;

    // 3) Generar QR
    try {
      const qrBase64 = await QRCode.toDataURL(urlMesa); // data:image/png;base64,...
      mesa.qrCode = qrBase64;
      await mesa.save();
    } catch (qrErr) {
      console.error("❌ Error generando QR:", qrErr?.message || qrErr);
      // Si prefieres hacer fallar la creación si no hay QR:
      // return res.status(500).json({ ok: false, msg: "No se pudo generar el QR" });
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Mesa creada",
      mesa,
      urlMesa, // <- para verificar qué quedó en el QR
    });
  } catch (error) {
    console.error("❌ Error al crear mesa:", error);
    return res.status(500).json({ ok: false, msg: "Error al crear la mesa", detalle: error.message });
  }
};

const obtenerMesas = async (_req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    return res.json(mesas); // el frontend espera array plano
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
    return res.json(mesa); // el frontend espera objeto plano
  } catch (error) {
    console.error("❌ Error al obtener la mesa por id:", error);
    return res.status(500).json({ ok: false, msg: "Error al obtener la mesa", detalle: error.message });
  }
};

module.exports = { crearMesa, obtenerMesas, obtenerMesaPorId };
