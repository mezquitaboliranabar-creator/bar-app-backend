const Session = require('../models/Session');
console.log("DEBUG Session:", Session);

const { v4: uuidv4 } = require('uuid');

const crearSession = async (req, res) => {
  try {
    console.log("📩 Body recibido:", req.body);

    const { mesa } = req.body;
    if (!mesa) {
      return res.status(400).json({ message: "El campo 'mesa' es obligatorio" });
    }

    // Crear nueva sesión con ID único
    const nuevaSession = new Session({
      mesa,
      sessionId: uuidv4(),
      activo: true
    });

    await nuevaSession.save();

    res.status(201).json(nuevaSession);
  } catch (error) {
    console.error("❌ Error al crear sesión:", error.message);
    res.status(500).json({ message: "Error al crear sesión", detalle: error.message });
  }
};


// Obtener todas las sesiones
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener sesiones', error });
  }
};

// Cerrar y eliminar sesión
const cerrarSession = async (req, res) => {
  try {
    const { id } = req.params;

    console.info(`🔹 Solicitud de cierre para la sesión: ${id}`);

    // Busca la sesión antes de borrar (para validación y log)
    const session = await Session.findById(id);
    if (!session) {
      console.warn(`⚠️ Sesión no encontrada: ${id}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // Marca como cerrada (si quieres conservar un log antes de borrar)
    session.activo = false;
    session.fechaCierre = new Date();
    await session.save();

    // Elimina el documento
    await Session.findByIdAndDelete(id);

    console.log(`✅ Sesión ${id} cerrada y eliminada de la base de datos`);
    res.json({ message: `Sesión ${id} cerrada y eliminada` });

  } catch (error) {
    console.error(`❌ Error al cerrar y eliminar sesión ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al cerrar y eliminar sesión', error: error.message });
  }
};


module.exports = {
  crearSession,
  getSessions,
  cerrarSession
};
