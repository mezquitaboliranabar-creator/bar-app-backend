const express = require('express');
const router = express.Router();

// ✅ Importa todo el módulo como un objeto
const sessionController = require('../controllers/sessionController');
console.log('sessionController:', sessionController);

// ✅ Usa las funciones desde el objeto
router.post('/', sessionController.crearSession);
router.get('/', sessionController.getSessions);
router.put('/:id/cerrar', sessionController.cerrarSession);

module.exports = router;