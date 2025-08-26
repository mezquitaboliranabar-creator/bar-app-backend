// models/SongRequest.js
const mongoose = require("mongoose");

const SongRequestSchema = new mongoose.Schema(
  {
    trackUri: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    imageUrl: {
      type: String,
      trim: true,
    },

    requestedBy: {
      sessionId: {
        type: String,
        required: true,
        index: true,
      },
      mesaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mesa",
        required: true,
        index: true,
      },
    },

    status: {
      type: String,
      enum: ["queued", "approved", "playing", "rejected", "done"],
      default: "queued",
      index: true,
    },

    votes: {
      type: Number,
      default: 0,
      min: 0,
    },

    playedAt: {
      type: Date,
      default: null,
    },

    rejectedReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

// Índices útiles para consultas típicas
SongRequestSchema.index({ "requestedBy.sessionId": 1, createdAt: -1 });
SongRequestSchema.index({ trackUri: 1, createdAt: -1 });
SongRequestSchema.index({ status: 1, createdAt: 1 });
// (opcional) para listados por mesa
SongRequestSchema.index({ "requestedBy.mesaId": 1, createdAt: -1 });

module.exports = mongoose.model("SongRequest", SongRequestSchema);
