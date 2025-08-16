const Categoria = require('../models/Categoria');

// Listar todas las categorías con sus bebidas
const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find()
      .populate({
        path: 'bebidas',
        options: { sort: { nombre: 1 } } // Ordena bebidas alfabéticamente
      })
      .sort({ nombre: 1 }); // Ordena categorías alfabéticamente

    res.json(categorias);
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener categorías', 
      detalle: error.message 
    });
  }
};


// Crear una nueva categoría
const crearCategoria = async (req, res) => {
  try {
    const { nombre, imagen } = req.body;
    const categoria = new Categoria({ nombre, imagen });
    await categoria.save();
    res.status(201).json(categoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({
  message: 'Error al crear categoría',
  error: error.message || 'Error desconocido'
});

  }
};

// Editar categoría
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, imagen } = req.body;
    const categoria = await Categoria.findByIdAndUpdate(
      id,
      { nombre, imagen },
      { new: true }
    );
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(categoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar categoría', error });
  }
};

// Eliminar categoría
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByIdAndDelete(id);
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar categoría', error });
  }
};

module.exports = {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
};
