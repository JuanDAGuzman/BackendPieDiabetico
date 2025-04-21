const Doctor = require("../models/doctorModel");
const Usuario = require("../models/usuarioModel");

exports.getAllDoctores = async (req, res, next) => {
  try {
    // Verificar si el usuario es admin (rol=1)
    const esAdmin = req.userData.rol === 1;

    // Si es admin, puede ver todos incluyendo pendientes
    const doctores = await Doctor.findAll(esAdmin);
    res.status(200).json({ data: doctores });
  } catch (error) {
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
    // Primero creamos el usuario
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
      // Datos específicos del doctor
      especialidad,
      numero_licencia,
      consulta_duracion_minutos,
      biografia,
    } = req.body;

    // Validar que el email no exista ya
    const existingUser = await Usuario.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Crear usuario con rol de doctor (id_rol=2)
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

    // Crear el doctor usando el id del usuario
    const nuevoDoctor = await Doctor.create({
      id_usuario: nuevoUsuario.id_usuario,
      especialidad,
      numero_licencia,
      consulta_duracion_minutos,
      biografia,
    });

    if (!nuevoDoctor) {
      // Rollback - eliminar usuario creado
      await db.query("DELETE FROM usuarios WHERE id_usuario = $1", [
        nuevoUsuario.id_usuario,
      ]);
      return res.status(500).json({ message: "Error al crear el doctor" });
    }

    // Combinar la información del usuario y doctor para la respuesta
    const doctorCompleto = {
      ...nuevoDoctor,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      email: nuevoUsuario.email,
      telefono: nuevoUsuario.telefono,
    };

    res.status(201).json({
      message: "Doctor creado exitosamente",
      data: doctorCompleto,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    // Actualizar datos del doctor
    const updatedDoctor = await Doctor.update(id, {
      especialidad: req.body.especialidad,
      numero_licencia: req.body.numero_licencia,
      consulta_duracion_minutos: req.body.consulta_duracion_minutos,
      biografia: req.body.biografia,
    });

    if (!updatedDoctor) {
      return res.status(500).json({ message: "Error al actualizar el doctor" });
    }

    // Actualizar datos del usuario si se proporcionan
    if (
      req.body.nombre ||
      req.body.apellido ||
      req.body.telefono ||
      req.body.direccion
    ) {
      await Usuario.update(doctor.id_usuario, {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
      });
    }

    // Obtener doctor actualizado con datos del usuario
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
