// controllers/mesaController.js
const Mesa = require("../models/Mesa");

// Crear una nueva mesa (sin FRONTEND_URL ni QR obligatorio)
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

    // Evitar duplicados por número
    const existe = await Mesa.findOne({ numero });
    if (existe) return res.status(400).json({ msg: "La mesa ya existe" });

    // Crear directo en MongoDB (qrCode queda null por defecto)
    const mesa = await Mesa.create({ numero });

    return res.status(201).json({
      ok: true,
      mensaje: "Mesa creada",
      mesa,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ msg: "La mesa ya existe" });
    }
    console.error("❌ Error al crear mesa:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al crear la mesa",
      detalle: error.message,
    });
  }
};

// Obtener todas las mesas
const obtenerMesas = async (_req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    return res.json(mesas);
  } catch (error) {
    console.error("❌ Error al obtener las mesas:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener las mesas",
      detalle: error.message,
    });
  }
};

// Obtener una mesa por ID
const obtenerMesaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const mesa = await Mesa.findById(id);
    if (!mesa) return res.status(404).json({ ok: false, msg: "Mesa no encontrada" });
    return res.json(mesa);
  } catch (error) {
    console.error("❌ Error al obtener la mesa por id:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener la mesa",
      detalle: error.message,
    });
  }
};

module.exports = { crearMesa, obtenerMesas, obtenerMesaPorId };
