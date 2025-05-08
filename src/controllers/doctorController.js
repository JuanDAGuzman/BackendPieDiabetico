const Doctor = require("../models/doctorModel");
const Usuario = require("../models/usuarioModel");
const db = require("../config/database");

exports.getAllDoctores = async (req, res, next) => {
  try {
    // Obtener todos los doctores sin filtrar por verificación
    const doctores = await Doctor.findAll(true);

    // Mostrar doctores con data adicional para depuración
    console.log(`Encontrados ${doctores.length} doctores`);

    res.status(200).json({ data: doctores });
  } catch (error) {
    console.error("Error en getAllDoctores:", error);
    next(error);
  }
};

exports.verificarDoctor = async (req, res, next) => {
  try {
    // Verificar si el usuario es admin
    if (req.userData.rol !== 1) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para realizar esta acción" });
    }

    const id = req.params.id;
    const { estado } = req.body;

    if (!estado || !["Aprobado", "Rechazado"].includes(estado)) {
      return res
        .status(400)
        .json({ message: "Estado de verificación inválido" });
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const updatedDoctor = await Doctor.verificarDoctor(id, estado);

    if (!updatedDoctor) {
      return res.status(500).json({ message: "Error al verificar el doctor" });
    }

    res.status(200).json({
      message: `Doctor ${
        estado === "Aprobado" ? "aprobado" : "rechazado"
      } exitosamente`,
      data: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};
exports.getDoctorById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    res.status(200).json({ data: doctor });
  } catch (error) {
    next(error);
  }
};

exports.createDoctor = async (req, res, next) => {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      numero_identificacion,
      tipo_identificacion,
      especialidad,
      numero_licencia,
      consulta_duracion_minutos,
      biografia,
    } = req.body;

    if (!especialidad) {
      return res.status(400).json({ message: "La especialidad es requerida" });
    }

    // Verificar si el número de licencia ya existe
    if (numero_licencia) {
      const licenciaCheck = await db.query(
        "SELECT * FROM doctores WHERE numero_licencia = $1",
        [numero_licencia]
      );

      if (licenciaCheck.rows.length > 0) {
        return res.status(400).json({
          message:
            "El número de licencia ya está registrado. Por favor, use otro.",
        });
      }
    }

    // Verificar si el email ya existe
    const existingUser = await Usuario.findByEmail(email);
    let userId;

    if (existingUser) {
      // Si el usuario ya existe, usamos su ID
      userId = existingUser.id_usuario;

      // Verificar si ya tiene un perfil de doctor
      const existingDoctor = await db.query(
        "SELECT * FROM doctores WHERE id_usuario = $1",
        [userId]
      );

      if (existingDoctor.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "Este usuario ya tiene un perfil de doctor" });
      }

      // Actualizamos el rol a doctor si es necesario
      if (existingUser.id_rol !== 2) {
        await db.query("UPDATE usuarios SET id_rol = 2 WHERE id_usuario = $1", [
          userId,
        ]);
      }
    } else {
      // Si no existe, creamos un nuevo usuario
      const nuevoUsuario = await Usuario.create({
        id_rol: 2, // Rol de doctor
        nombre,
        apellido,
        email,
        password,
        telefono,
        direccion,
        fecha_nacimiento,
        genero,
        numero_identificacion,
        tipo_identificacion,
      });

      if (!nuevoUsuario) {
        return res.status(500).json({ message: "Error al crear el usuario" });
      }

      userId = nuevoUsuario.id_usuario;
    }

    // Crear el perfil de doctor
    const nuevoDoctor = await Doctor.create({
      id_usuario: userId,
      especialidad,
      numero_licencia,
      consulta_duracion_minutos,
      biografia,
    });

    res.status(201).json({
      message: "Perfil de doctor creado exitosamente",
      data: {
        ...nuevoDoctor,
        nombre: existingUser ? existingUser.nombre : nombre,
        apellido: existingUser ? existingUser.apellido : apellido,
        email: existingUser ? existingUser.email : email,
      },
    });
  } catch (error) {
    console.error("Error en createDoctor:", error);
    next(error);
  }
};
exports.completarPerfilDoctor = async (req, res, next) => {
  try {
    const id_usuario = req.userData.id;

    // Verificar si ya tiene perfil de doctor
    const existingDoctor = await db.query(
      "SELECT * FROM doctores WHERE id_usuario = $1",
      [id_usuario]
    );

    if (existingDoctor.rows.length > 0) {
      return res.status(400).json({ message: "Ya tienes un perfil de doctor" });
    }

    const {
      especialidad,
      numero_licencia,
      consulta_duracion_minutos,
      biografia,
    } = req.body;

    if (!especialidad) {
      return res.status(400).json({ message: "La especialidad es requerida" });
    }

    // Verificar si el número de licencia ya existe
    if (numero_licencia) {
      const licenciaCheck = await db.query(
        "SELECT * FROM doctores WHERE numero_licencia = $1",
        [numero_licencia]
      );

      if (licenciaCheck.rows.length > 0) {
        return res.status(400).json({
          message:
            "El número de licencia ya está registrado. Por favor, use otro.",
        });
      }
    }

    // Actualizar el rol a doctor si es necesario
    if (req.userData.rol !== 2) {
      await db.query("UPDATE usuarios SET id_rol = 2 WHERE id_usuario = $1", [
        id_usuario,
      ]);
    }

    // Crear el perfil de doctor
    const nuevoDoctor = await Doctor.create({
      id_usuario,
      especialidad,
      numero_licencia,
      consulta_duracion_minutos: consulta_duracion_minutos || 30,
      biografia,
    });

    res.status(201).json({
      message: "Perfil de doctor completado exitosamente",
      data: nuevoDoctor,
    });
  } catch (error) {
    console.error("Error en completarPerfilDoctor:", error);
    next(error);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Obtener el doctor
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    // Verificar permisos (solo el propio doctor o administradores)
    if (req.userData.rol !== 1) {
      // Verificar si es el propio doctor
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length === 0 ||
        resultDoctor.rows[0].id_doctor !== parseInt(id)
      ) {
        return res.status(403).json({
          message: "No tienes permisos para actualizar este perfil de doctor",
        });
      }
    }

    // Continuar con la actualización
    const updatedDoctor = await Doctor.update(id, {
      especialidad: req.body.especialidad,
      numero_licencia: req.body.numero_licencia,
      consulta_duracion_minutos: req.body.consulta_duracion_minutos,
      biografia: req.body.biografia,
    });

    if (!updatedDoctor) {
      return res.status(500).json({ message: "Error al actualizar el doctor" });
    }

    // Obtener el doctor actualizado con datos del usuario
    const doctorActualizado = await Doctor.findById(id);

    res.status(200).json({
      message: "Doctor actualizado exitosamente",
      data: doctorActualizado,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const deletedDoctor = await Doctor.delete(id);

    if (!deletedDoctor) {
      return res.status(500).json({ message: "Error al desactivar el doctor" });
    }

    res.status(200).json({
      message: "Doctor desactivado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getCentrosDoctor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const centros = await Doctor.getCentros(id);

    res.status(200).json({ data: centros });
  } catch (error) {
    next(error);
  }
};

exports.getHorariosDoctor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const horarios = await Doctor.getHorarios(id);

    res.status(200).json({ data: horarios });
  } catch (error) {
    next(error);
  }
};

exports.getPacientesDoctor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const pacientes = await Doctor.getPacientes(id);

    res.status(200).json({ data: pacientes });
  } catch (error) {
    next(error);
  }
};
