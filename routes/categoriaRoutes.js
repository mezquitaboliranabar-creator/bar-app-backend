const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Rutas para categorías
router.get('/', categoriaController.getCategorias);
router.post('/', categoriaController.crearCategoria);
router.put('/:id', categoriaController.actualizarCategoria);
router.delete('/:id', categoriaController.eliminarCategoria);

module.exports = router;
