const Mesa = require("../models/Mesa");
const QRCode = require("qrcode");

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

    // Crear la mesa sin QR aún
    const nuevaMesa = await Mesa.create({ numero, qrCode: "" });

    // URL del FRONTEND que irá en el QR
    // Aquí puedes decidir si pasas el ID por query
    const urlMesa = `${process.env.FRONTEND_CLIENT_URL}?mesa=${nuevaMesa._id}`;

    // Generar QR apuntando al frontend
    const qrCode = await QRCode.toDataURL(urlMesa);

    // Guardar el QR en la mesa
    nuevaMesa.qrCode = qrCode;
    await nuevaMesa.save();

    res.status(201).json(nuevaMesa);
  } catch (error) {
    console.error("❌ Error al crear la mesa:", error);
    res.status(500).json({ msg: "Error al crear la mesa", detalle: error.message });
  }
};

// Obtener mesas
const obtenerMesas = async (req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    res.json(mesas);
    console.log(`✅ Mesas obtenidas: ${mesas.length}`);
  } catch (error) {
    console.error("❌ Error al obtener las mesas:", error);
    res.status(500).json({ msg: "Error al obtener las mesas", detalle: error.message });
  }
};

module.exports = { crearMesa, obtenerMesas };