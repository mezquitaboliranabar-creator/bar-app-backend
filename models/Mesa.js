const mongoose = require("mongoose");


const mesaSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true,
    unique: true
  },
  qrCode: {
    type: String, // Guardaremos la URL o base64 del QR
    required: true,
    trim: true
  },
  estado: {
    type: String,
    enum: ["libre", "ocupada"],
    default: "libre"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Mesa", mesaSchema);
