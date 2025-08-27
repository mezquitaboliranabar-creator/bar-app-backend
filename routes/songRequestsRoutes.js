// routes/songRequestsRoutes.js
const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/songRequestsController");

// Intentar cargar el guard de sesión (opcional/seguro)
let requireActiveSession = null;
try {
  const sg = require("../middlewares/sessionGuard");
  if (sg && typeof sg.requireActiveSession === "function") {
    requireActiveSession = sg.requireActiveSession;
  } else {
    console.warn("⚠️ middlewares/sessionGuard cargado, pero 'requireActiveSession' no es una función. La creación de solicitudes no estará protegida.");
  }
} catch (e) {
  console.warn("⚠️ No se pudo cargar middlewares/sessionGuard. La creación de solicitudes no estará protegida.", e?.message || e);
}

// Crear solicitud (protegido si existe el guard)
if (requireActiveSession) {
  router.post("/", requireActiveSession, ctrl.crearSolicitud);
} else {
  router.post("/", ctrl.crearSolicitud);
}

// Listar
router.get("/", ctrl.listarSolicitudes);

// Estado (ruta oficial)
router.put("/:id/status", ctrl.actualizarEstado);

// ✅ Alias para compatibilidad (evita 404 si el front llama /:id)
router.put("/:id", ctrl.actualizarEstado);

// Votar y eliminar (se mantienen igual)
router.post("/:id/vote", ctrl.votar);
router.delete("/:id", ctrl.eliminar);

module.exports = router;
