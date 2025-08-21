const mongoose = require("mongoose");

const mesaSchema = new mongoose.Schema(
  {
    numero: { type: Number, required: true, unique: true },
    qrCode: { type: String, trim: true, default: null }, // opcional
    estado: { type: String, enum: ["libre", "ocupada", "reservada"], default: "libre" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Mesa || mongoose.model("Mesa", mesaSchema);
