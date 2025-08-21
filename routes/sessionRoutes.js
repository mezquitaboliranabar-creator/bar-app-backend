const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/promocionController");

// (opcional mientras pruebas)
console.log("[PROMOS ROUTES] cargado:", __filename);
router.stack = router.stack || [];
// imprime las rutas cargadas
process.nextTick(() => {
  router.stack.forEach(l => {
    if (l.route) console.log("[PROMOS ROUTE]", Object.keys(l.route.methods), l.route.path);
  });
});

// RUTAS RELATIVAS (¡sin /api/promociones aquí!)
router.get("/", ctrl.listarPromociones);
router.get("/:id", ctrl.obtenerPromocion);
router.post("/", ctrl.crearPromocion);
router.put("/:id", ctrl.actualizarPromocion);
router.delete("/:id", ctrl.eliminarPromocion);

// (sanity ping temporal)
// router.get("/_ping", (_req, res) => res.json({ ok: true }));

module.exports = router; // <- asegúrate de exportar el router
