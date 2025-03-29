const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const db = require('../config/database');

// Middleware de autenticación básica
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Autenticación requerida' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar si el usuario es admin
const esAdmin = (req, res, next) => {
  if (req.userData.rol !== 1) {
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

// Middleware para verificar si el usuario es doctor verificado
const esDoctorVerificado = async (req, res, next) => {
  try {
    // Si es admin, siempre tiene acceso
    if (req.userData.rol === 1) {
      return next();
    }
    
    // Si el rol no es doctor, no tiene acceso
    if (req.userData.rol !== 2) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    
    // Verificar que el doctor esté aprobado
    const result = await db.query(
      'SELECT * FROM doctores WHERE id_usuario = $1 AND estado_verificacion = $2',
      [req.userData.id, 'Aprobado']
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ 
        message: 'Tu solicitud como doctor está pendiente de aprobación por un administrador' 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar acceso a recursos de paciente específico
const accesoPaciente = async (req, res, next) => {
  try {
    const idPacienteRecurso = parseInt(req.params.id_paciente || req.params.id);
    
    // Si es admin o no hay id de paciente en los parámetros, continuar
    if (req.userData.rol === 1 || !idPacienteRecurso) {
      return next();
    }
    
    // Si es doctor verificado, verificar si el paciente está asignado al doctor
    if (req.userData.rol === 2) {
      // Obtener id_doctor del usuario
      const resultDoctor = await db.query(
        'SELECT id_doctor FROM doctores WHERE id_usuario = $1',
        [req.userData.id]
      );
      
      if (resultDoctor.rows.length > 0) {
        const idDoctor = resultDoctor.rows[0].id_doctor;
        
        // Verificar si el paciente está asignado a este doctor
        const resultPaciente = await db.query(
          'SELECT * FROM pacientes WHERE id_paciente = $1 AND id_doctor_principal = $2',
          [idPacienteRecurso, idDoctor]
        );
        
        if (resultPaciente.rows.length > 0) {
          return next();
        }
      }
    }
    
    // Si es el propio paciente accediendo a sus datos
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        'SELECT id_paciente FROM pacientes WHERE id_usuario = $1',
        [req.userData.id]
      );
      
      if (resultPaciente.rows.length > 0 && resultPaciente.rows[0].id_paciente === idPacienteRecurso) {
        return next();
      }
    }
    
    return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authMiddleware,
  esAdmin,
  esDoctorVerificado,
  accesoPaciente
};