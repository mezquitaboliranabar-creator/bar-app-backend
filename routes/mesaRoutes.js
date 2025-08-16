const express = require("express");
const { crearMesa, obtenerMesas } = require("../controllers/mesaController");
console.log(typeof crearMesa); // 👉 debe imprimir "function"



const router = express.Router();

// Rutas para mesas
router.post("/", crearMesa);
router.get("/", obtenerMesas);

module.exports = router;
