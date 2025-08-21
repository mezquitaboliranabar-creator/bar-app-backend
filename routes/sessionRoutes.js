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

const { startOrGetSession, getActiveByMesa, closeSession } = ctrl;

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

module.exports = router;
