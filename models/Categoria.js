const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  imagen: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Permite que los virtuals aparezcan en JSON
  toObject: { virtuals: true } // También en objetos JS
});

// Virtual populate: relaciona _id de Categoria con campo "categoria" de Bebida
categoriaSchema.virtual('bebidas', {
  ref: 'Bebida',
  localField: '_id',
  foreignField: 'categoria'
});

module.exports = mongoose.model('Categoria', categoriaSchema);