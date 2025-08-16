const express = require('express');
const router = express.Router();
const {
  getBebidas,
  createBebida,
  updateBebida,
  deleteBebida
} = require('../controllers/bebidaController');

// Rutas para bebidas
router.get('/', getBebidas);
router.post('/', createBebida);
router.put('/:id', updateBebida);
router.delete('/:id', deleteBebida);

module.exports = router;