const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// ---------- Middlewares ----------
app.use(express.json());

// CORS: localhost + Vercel (y/o ALLOWED_ORIGINS en .env separados por coma)
const defaultAllowed = [
  'http://localhost:3000',
  'https://bar-app-frontend-bar-client.vercel.app',
].filter(Boolean);

const envAllowed =
  process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) || [];

const allowedOrigins = [...new Set([...defaultAllowed, ...envAllowed])];

app.use(
  cors({
    origin(origin, callback) {
      // permitir reqs sin Origin (Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // cámbialo a true si vas a usar cookies
  })
);

// Preflight para todas
app.options('*', cors());

// ---------- Rutas ----------
const mesaRoutes = require('./routes/mesaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const bebidaRoutes = require('./routes/bebidaRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const promocionesRoutes = require('./routes/promocionesRoutes');
const songRequestsRoutes = require('./routes/songRequestsRoutes');
const musicSearchRoutes = require('./routes/musicSearchRoutes');
const spotifyAuthRoutes = require("./routes/spotifyAuthRoutes");
const playbackRoutes = require('./routes/spotifyPlaybackRoutes');

app.use('/api/mesas', mesaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/music/requests', songRequestsRoutes);
app.use('/api/music/search', musicSearchRoutes);
app.use("/api/music/spotify", spotifyAuthRoutes);
app.use('/api/music/playback', playbackRoutes);

// Healthcheck
app.get('/health', (_req, res) => res.send('ok'));

// ---------- Conexión a MongoDB ----------
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI no está definida en las variables de entorno');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // dbName: process.env.MONGO_DB_NAME || 'bar_app', // si tu URI no incluye nombre de DB
  })
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Backend en puerto ${PORT}`);
      console.log('🌐 CORS orígenes permitidos:', allowedOrigins.join(', ') || '(ninguno)');
    });
  })
  .catch((err) => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });
