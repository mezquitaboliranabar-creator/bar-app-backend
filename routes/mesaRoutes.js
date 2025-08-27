// routes/mesaRoutes.js
const express = require("express");
const {
  crearMesa,
  obtenerMesas,
  obtenerMesaPorId,
  cerrarMesaManual, // ⬅️ agrega esto
} = require("../controllers/mesaController");

const router = express.Router();

router.post("/", crearMesa);
router.get("/", obtenerMesas);
router.get("/:id", obtenerMesaPorId);

// ⬇️ NUEVO: cierre manual (idempotente)
router.post("/:id/close", cerrarMesaManual);

module.exports = router;
