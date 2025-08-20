const Mesa = require("../models/Mesa");
const QRCode = require("qrcode");

// Crear una nueva mesa
const crearMesa = async (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({ error: "El número de mesa es obligatorio" });
    }

    const existeMesa = await Mesa.findOne({ numero });
    if (existeMesa) {
      return res.status(400).json({ msg: "La mesa ya existe" });
    }

    // Crear la mesa primero sin QR
    const nuevaMesa = await Mesa.create({ numero });

    // Construir la URL para el QR usando el _id de la mesa
    const urlMesa = `https://bar-app-frontend-bar-client.vercel.app/?mesa=${nuevaMesa._id}`;

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

// Obtener mesas
const obtenerMesas = async (req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    console.log(`✅ Mesas obtenidas: ${mesas.length}`);
    res.json(mesas);
  } catch (error) {
    console.error("❌ Error al obtener las mesas:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener las mesas",
      detalle: error.message
    });
  }
};

module.exports = { crearMesa, obtenerMesas };
