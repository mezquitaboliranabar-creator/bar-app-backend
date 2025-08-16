const mongoose = require('mongoose');

const bebidaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bebida', bebidaSchema);
