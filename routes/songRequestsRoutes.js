// routes/songRequestsRoutes.js
const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/songRequestsController");

// Crear solicitud de canción
router.post("/", ctrl.crearSolicitud);

// Listar solicitudes (filtros por query: status, sessionId, mesaId, limit, page, sort)
router.get("/", ctrl.listarSolicitudes);

// Actualizar estado de una solicitud (approved | rejected | playing | done)
router.put("/:id/status", ctrl.actualizarEstado);

// Votar una solicitud (delta opcional, default +1)
router.post("/:id/vote", ctrl.votar);

// Eliminar una solicitud
router.delete("/:id", ctrl.eliminar);

// (opcional para prueba rápida)
// router.get("/ping", (_req, res) => res.json({ ok: true, src: "songRequestsRoutes" }));

module.exports = router;
