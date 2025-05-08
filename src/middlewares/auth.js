const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");
const db = require("../config/database");

// Middleware de autenticación básica
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.userData = decoded;
    next();
  } catch (error) {
    // Capturar y registrar cualquier error en la verificación
    console.error("Error de autenticación:", error.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
// Middleware para verificar si el usuario es admin
const esAdmin = (req, res, next) => {
  if (!req.userData || req.userData.rol !== 1) {
    return res
      .status(403)
      .json({ message: "No tienes permisos para realizar esta acción" });
  }
  next();
};

// Middleware para verificar si el usuario es doctor verificado
const esDoctorVerificado = async (req, res, next) => {
  try {
    // Verificar que req.userData exista
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    // Si es admin, siempre tiene acceso
    if (req.userData.rol === 1) {
      return next();
    }

    // Si el rol no es doctor, no tiene acceso
    if (req.userData.rol !== 2) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para realizar esta acción" });
    }

    // Verificar que el doctor esté aprobado
    const result = await db.query(
      "SELECT * FROM doctores WHERE id_usuario = $1",
      [req.userData.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "No se encontró el perfil de doctor asociado a este usuario",
      });
    }

    // Verificar el estado de verificación si la columna existe
    // Primero, verificamos si la columna estado_verificacion existe en la tabla doctores
    try {
      const verificacion = await db.query(
        "SELECT * FROM doctores WHERE id_usuario = $1 AND estado_verificacion = $2",
        [req.userData.id, "Aprobado"]
      );

      if (verificacion.rows.length === 0) {
        return res.status(403).json({
          message:
            "Tu solicitud como doctor está pendiente de aprobación por un administrador",
        });
      }
    } catch (columnError) {
      // Si hay un error con la columna estado_verificacion, continuamos igual
      // porque la columna podría no existir todavía
      console.error("Error al verificar el estado del doctor:", columnError);
    }

    next();
  } catch (error) {
    console.error("Error en middleware esDoctorVerificado:", error);
    next(error);
  }
};

// Middleware para verificar acceso a recursos de paciente específico
const accesoPaciente = async (req, res, next) => {
  try {
    // Verificar que req.userData exista
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const idPacienteRecurso = parseInt(req.params.id_paciente || req.params.id);

    // Si es admin o no hay id de paciente en los parámetros, continuar
    if (
      req.userData.rol === 1 ||
      !idPacienteRecurso ||
      isNaN(idPacienteRecurso)
    ) {
      return next();
    }

    // Si es doctor verificado, verificar si el paciente está asignado al doctor
    if (req.userData.rol === 2) {
      // Obtener id_doctor del usuario
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const idDoctor = resultDoctor.rows[0].id_doctor;

        // Verificar si el paciente está asignado a este doctor como principal
        const resultPacientePrincipal = await db.query(
          "SELECT * FROM pacientes WHERE id_paciente = $1 AND id_doctor_principal = $2",
          [idPacienteRecurso, idDoctor]
        );

        if (resultPacientePrincipal.rows.length > 0) {
          return next();
        }

        // Intentar verificar si existe la tabla doctor_paciente y si el paciente está asignado
        try {
          const resultPacienteAsignado = await db.query(
            "SELECT * FROM doctor_paciente WHERE id_paciente = $1 AND id_doctor = $2",
            [idPacienteRecurso, idDoctor]
          );

          if (resultPacienteAsignado.rows.length > 0) {
            return next();
          }
        } catch (tableError) {
          // Si la tabla no existe, ignoramos este error
          console.error(
            "Error al verificar la relación doctor_paciente:",
            tableError
          );
        }
      }
    }

    // Si es el propio paciente accediendo a sus datos
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultPaciente.rows.length > 0) {
        const pacienteId = resultPaciente.rows[0].id_paciente;
        if (pacienteId === idPacienteRecurso) {
          return next();
        }
      }
    }

    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a este recurso" });
  } catch (error) {
    console.error("Error en middleware accesoPaciente:", error);
    next(error);
  }
};

module.exports = {
  authMiddleware,
  esAdmin,
  esDoctorVerificado,
  accesoPaciente,
};
