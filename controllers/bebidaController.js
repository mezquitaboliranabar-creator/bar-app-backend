const Bebida = require('../models/Bebida');

// Obtener todas las bebidas (optimizado)
const getBebidas = async (req, res) => {
  try {
    const bebidas = await Bebida.find()
      .select('nombre precio categoria') // Solo campos necesarios
      .populate('categoria', 'nombre')   // Solo el nombre de la categoría
      .sort({ nombre: 1 })               // Ordenar por nombre de bebida
      .lean();                           // Mejora de rendimiento

    res.json(bebidas);
  } catch (error) {
    console.error('❌ Error al obtener bebidas:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener bebidas', 
      detalle: error.message 
    });
  }
};

// Crear una bebida
const createBebida = async (req, res) => {
  try {
    const { nombre, precio, categoria } = req.body;
    const bebida = new Bebida({ nombre, precio, categoria });
    await bebida.save();
    res.status(201).json(bebida);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la bebida' });
  }
};

// Actualizar una bebida
const updateBebida = async (req, res) => {
  try {
    const bebida = await Bebida.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bebida) return res.status(404).json({ error: 'Bebida no encontrada' });
    res.json(bebida);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la bebida' });
  }
};

// Eliminar una bebida
const deleteBebida = async (req, res) => {
  try {
    const bebida = await Bebida.findByIdAndDelete(req.params.id);
    if (!bebida) return res.status(404).json({ error: 'Bebida no encontrada' });
    res.json({ mensaje: 'Bebida eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la bebida' });
  }
};

module.exports = {
  getBebidas,
  createBebida,
  updateBebida,
  deleteBebida
};
