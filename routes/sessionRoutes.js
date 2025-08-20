// routes/sessionRoutes.js
const express = require("express");
const router = express.Router();
const { startOrGetSession, getActiveByMesa, closeSession } = require("../controllers/sessionController");

// Crear o reutilizar sesión activa de una mesa
router.post("/start", startOrGetSession);

// Obtener sesión activa por mesa
router.get("/by-mesa/:mesaId", getActiveByMesa);

// Cerrar sesión por sessionId
router.post("/:sessionId/close", closeSession);

module.exports = router;
