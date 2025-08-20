const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// ---------- Middlewares ----------
app.use(express.json());

// CORS solo con origen local (puedes añadir otros si lo necesitas)
app.use(
  cors({
    origin: ['http://localhost:3000'], // tu front local
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------- Rutas ----------
const mesaRoutes = require('./routes/mesaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const bebidaRoutes = require('./routes/bebidaRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

app.use('/api/mesas', mesaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/sessions', sessionRoutes);

// Endpoint simple para comprobar que Render responde
app.get('/health', (_req, res) => res.send('ok'));

// ---------- Conexión a MongoDB ----------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Backend en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });
