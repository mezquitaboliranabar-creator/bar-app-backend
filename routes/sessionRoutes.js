const express = require("express");
const router = express.Router();

let ctrl;
try {
  ctrl = require("../controllers/sessionController"); // 👈 path/case exactos
  console.log("DEBUG sessionController keys:", Object.keys(ctrl));
} catch (e) {
  console.error("❌ No se pudo cargar sessionController:", e);
  throw e;
}

const { startOrGetSession, getActiveByMesa, closeSession, ping } = ctrl;

if (typeof startOrGetSession !== "function") {
  throw new Error("startOrGetSession está undefined. Revisa controllers/sessionController.js (exports/nombres/ruta).");
}
if (typeof getActiveByMesa !== "function") {
  throw new Error("getActiveByMesa está undefined. Revisa controllers/sessionController.js.");
}
if (typeof closeSession !== "function") {
  throw new Error("closeSession está undefined. Revisa controllers/sessionController.js.");
}

// Crear o reutilizar sesión activa de una mesa
router.post("/start", startOrGetSession);

// Obtener sesión activa por mesa
router.get("/by-mesa/:mesaId", getActiveByMesa);

// Cerrar sesión por sessionId
router.post("/:sessionId/close", closeSession);

//(opcional/seguro): heartbeat para mantener/validar sesión
// Se registran solo si el controller exporta 'ping'
if (typeof ping === "function") {
  // permite enviar el sessionId en la URL
  router.post("/:sessionId/ping", ping);
  // y también en el body (por si te queda cómodo en el front)
  router.post("/ping", ping);
} else {
  console.warn("⚠️ 'ping' no está exportado por sessionController. Rutas /api/sessions/:sessionId/ping y /api/sessions/ping no registradas.");
}

module.exports = router;
