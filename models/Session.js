// models/Session.js
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: "Mesa", required: true },
    sessionId: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sessionSchema.index(
  { mesa: 1, active: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

module.exports = mongoose.models.Session || mongoose.model("Session", sessionSchema);
