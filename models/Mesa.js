// models/Mesa.js
const mongoose = require("mongoose");

const mesaSchema = new mongoose.Schema(
  {
    numero: {
      type: Number,
      required: true,
      unique: true,
    },
    qrCode: {
      type: String, // Base64 del QR generado
    },
    estado: {
      type: String,
      enum: ["libre", "ocupada", "reservada"],
      default: "libre",
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

// Evita recompilar el modelo recarga (Hot Reload en entornos con)
module.exports = mongoose.models.Mesa || mongoose.model("Mesa", mesaSchema);