const express = require("express");
const router = express.Router();
const { crearMesa, obtenerMesas } = require("../controllers/mesaController");

router.post("/", crearMesa);
router.get("/", obtenerMesas);

module.exports = router;