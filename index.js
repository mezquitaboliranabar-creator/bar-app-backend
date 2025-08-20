const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// CORS (Vercel + local)
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL, // prod
      'http://localhost:5000',  // dev local (opcional)
    ].filter(Boolean),
    // credentials: true, // si en el futuro manejas cookies
  })
);

// Rutas
const mesaRoutes = require('./routes/mesaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const bebidaRoutes = require('./routes/bebidaRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

app.use('/api/mesas', mesaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/sessions', sessionRoutes);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // dbName: process.env.MONGO_DB_NAME || 'bar_app', // opcional si tu URI no tiene DB
  })
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
      console.log('🌐 FRONTEND_URL permitido por CORS:', process.env.FRONTEND_URL);
    });
  })
  .catch((err) => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });
