const Mesa = require("../models/Mesa");
const QRCode = require("qrcode");
console.log("Mesa model importado:", Mesa);

// Crear una nueva mesa
const crearMesa = async (req, res) => {
  try {
    const { numero } = req.body;

    // Validación básica
    if (!numero) {
      return res.status(400).json({ error: "El número de mesa es obligatorio" });
    }

    const existeMesa = await Mesa.findOne({ numero });
    if (existeMesa) {
      return res.status(400).json({ msg: "La mesa ya existe" });
    }

    // URL del frontend en Vercel donde el cliente accederá a la mesa
    const urlMesa = `https://bar-app-frontend-bar-client.vercel.app/session?mesa=${numero}`;

    // Generar QR apuntando al frontend
    const qrCode = await QRCode.toDataURL(urlMesa);

    const nuevaMesa = await Mesa.create({
      numero,
      qrCode
    });

    res.status(201).json(nuevaMesa);
  } catch (error) {
    console.error("❌ Error al crear la mesa:", error);
    res.status(500).json({ msg: "Error al crear la mesa", detalle: error.message });
  }
};

// Obtener todas las mesas ordenadas por número
const obtenerMesas = async (req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 }); // 1 = ascendente
    res.json(mesas);
    console.log(`✅ Mesas obtenidas y ordenadas por número: ${mesas.length}`);
  } catch (error) {
    console.error("❌ Error al obtener las mesas:", error);
    res.status(500).json({
      msg: "Error al obtener las mesas",
      detalle: error.message
    });
  }
};

module.exports = { crearMesa, obtenerMesas };
