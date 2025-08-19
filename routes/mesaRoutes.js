const express = require("express");
const { crearMesa, obtenerMesas } = require("../controllers/mesaController");
const Mesa = require("../models/Mesa");

console.log(typeof crearMesa); // debe imprimir "function"

const router = express.Router();

// Endpoint para redirección desde QR
router.get("/qr/mesa/:id", async (req, res) => {
  try {
    const mesa = await Mesa.findById(req.params.id);
    if (!mesa) {
      return res.status(404).send("Mesa no encontrada");
    }
    // Redirige al frontend cliente con el ID de mesa
    res.redirect(`https://bar-app-frontend-bar-client.vercel.app/session?mesa=${mesa._id}`);
  } catch (error) {
    console.error("❌ Error en QR redirect:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// Rutas para mesas
router.post("/", crearMesa);
router.get("/", obtenerMesas);

module.exports = router;