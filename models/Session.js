const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    mesa: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Mesa", 
      required: [true, "La mesa es obligatoria"], 
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "El ID de mesa no es válido"
      }
    },
    sessionId: { 
      type: String, 
      required: [true, "El sessionId es obligatorio"], 
      unique: true,
      trim: true
    },
    activo: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true,
    versionKey: false // opcional: limpia el _v
  }
);

// Índice para búsquedas rápidas por sessionId
sessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Session", sessionSchema);
