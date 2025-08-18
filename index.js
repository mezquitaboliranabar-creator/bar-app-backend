const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const mesaRoutes = require('./routes/mesaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const bebidaRoutes = require('./routes/bebidaRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

// Usar rutas
app.use('/api/mesas', mesaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/sessions', sessionRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');

  // Levantar el servidor solo si la conexión fue exitosa
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ Error de conexión a MongoDB:', err.message);
  process.exit(1); // Salir si falla la conexión
});