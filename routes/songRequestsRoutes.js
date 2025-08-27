const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/songRequestsController");

// Crear solicitud
router.post("/", ctrl.crearSolicitud);

// Listar
router.get("/", ctrl.listarSolicitudes);

// Estado (ruta oficial)
router.put("/:id/status", ctrl.actualizarEstado);

// ✅ Alias para compatibilidad (evita 404 si el front llama /:id)
router.put("/:id", ctrl.actualizarEstado);

router.post("/:id/vote", ctrl.votar);
router.delete("/:id", ctrl.eliminar);

module.exports = router;
