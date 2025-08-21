const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/promocionController");

// CRUD
router.get("/", ctrl.listarPromociones);
router.get("/:id", ctrl.obtenerPromocion);
router.post("/", ctrl.crearPromocion);
router.put("/:id", ctrl.actualizarPromocion);
router.delete("/:id", ctrl.eliminarPromocion);

module.exports = router;
