// routes/mesaRoutes.js
const express = require("express");
const {
  crearMesa,
  obtenerMesas,
  obtenerMesaPorId,
  // obtenerMesaPorNumero, // (opcional)
} = require("../controllers/mesaController");

const router = express.Router();

// OJO: si algún día usas /by-numero/:numero, ponlo ANTES de "/:id"
router.post("/", crearMesa);
router.get("/", obtenerMesas);
// router.get("/by-numero/:numero", obtenerMesaPorNumero); // opcional
router.get("/:id", obtenerMesaPorId); // <- ESTA ES LA QUE FALTA

module.exports = router;
