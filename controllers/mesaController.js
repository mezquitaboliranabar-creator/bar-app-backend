const Mesa = require("../models/Mesa");
const QRCode = require("qrcode");

// Crear una nueva mesa
const crearMesa = async (req, res) => {
  try {
    const { numero } = req.body;
    if (!numero) {
      return res.status(400).json({ error: "El número de mesa es obligatorio" });
    }

    // Validar que FRONTEND_URL exista
    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({
        ok: false,
        msg: "Variable FRONTEND_URL no configurada en el backend"
      });
    }

    const existeMesa = await Mesa.findOne({ numero });
    if (existeMesa) {
      return res.status(400).json({ msg: "La mesa ya existe" });
    }

    // Crear la mesa sin QR
    const nuevaMesa = await Mesa.create({ numero });

    // Construir la URL del QR apuntando al frontend
    const urlMesa = `${process.env.FRONTEND_URL}/mesa/${nuevaMesa._id}`;

    // Generar QR en base64
    const qrCodeBase64 = await QRCode.toDataURL(urlMesa);

    // Guardar QR en la mesa
    nuevaMesa.qrCode = qrCodeBase64;
    await nuevaMesa.save();

    res.status(201).json({
      ok: true,
      mensaje: "Mesa creada con QR",
      mesa: nuevaMesa
    });

  } catch (error) {
    console.error("❌ Error al crear la mesa:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al crear la mesa",
      detalle: error.message
    });
  }
};

const obtenerMesas = async (req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    res.json(mesas);
  } catch (error) {
    console.error("❌ Error al obtener las mesas:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener las mesas", detalle: error.message });
  }
};

const obtenerMesaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const mesa = await Mesa.findById(id);
    if (!mesa) return res.status(404).json({ ok: false, msg: "Mesa no encontrada" });
    res.json(mesa);
  } catch (error) {
    console.error("❌ Error al obtener la mesa por id:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener la mesa", detalle: error.message });
  }
};

module.exports = { crearMesa, obtenerMesas, obtenerMesaPorId };