const mongoose = require("mongoose");
const { Schema } = mongoose;

const PromocionSchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    descripcion: { type: String, trim: true, maxlength: 400 },
    imagenUrl: { type: String, required: true, trim: true },
    activa: { type: Boolean, default: true },
    inicia: { type: Date },
    termina: { type: Date },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PromocionSchema.index({ orden: 1, activa: 1 });
PromocionSchema.index({ inicia: 1, termina: 1 });

module.exports =
  mongoose.models.Promocion ||
  mongoose.model("Promocion", PromocionSchema, "promociones");
