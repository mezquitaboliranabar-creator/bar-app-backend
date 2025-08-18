const mongoose = require('mongoose');

const spotifyQueueSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    trim: true
  },
  cancionId: {
    type: String,
    required: true,
    trim: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  artista: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'reproducida'],
    default: 'pendiente'
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SpotifyQueue', spotifyQueueSchema);
