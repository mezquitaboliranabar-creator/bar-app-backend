// models/Session.js (fragmento relevante)
const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: "Mesa", required: true, index: true },
    sessionId: { type: String, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },
    startedAt: { type: Date, default: Date.now },

    // control de inactividad
    lastActivityAt: { type: Date, default: Date.now },

    closedAt: { type: Date, default: null },

    // motivo de cierre
    closedReason: { type: String, enum: ["manual", "idle", "absolute"], default: null },
  },
  { timestamps: true }
);

// Útil para consultas rápidas
SessionSchema.index({ mesa: 1, active: 1 });

module.exports = mongoose.model("Session", SessionSchema);
