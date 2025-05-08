const Paciente = require("../models/pacienteModel");
const Usuario = require("../models/usuarioModel");
const db = require("../config/database");

exports.getAllPacientes = async (req, res, next) => {
  try {
    const pacientes = await Paciente.findAll();
    res.status(200).json({ data: pacientes });
  } catch (error) {
    next(error);
  }
};

exports.completarPerfilPaciente = async (req, res, next) => {
  try {
    const id_usuario = req.userData.id;

    // Verificar si ya tiene perfil de paciente
    const existingPaciente = await db.query(
      "SELECT * FROM pacientes WHERE id_usuario = $1",
      [id_usuario]
    );

    if (existingPaciente.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Ya tienes un perfil de paciente" });
    }

    const {
      id_doctor_principal,
      tipo_sangre,
      peso,
      altura,
      alergias,
      fecha_diagnostico_diabetes,
      tipo_diabetes,
      nivel_riesgo,
      observaciones,
    } = req.body;

    // Actualizar el rol a paciente si es necesario
    if (req.userData.rol !== 3) {
      await db.query("UPDATE usuarios SET id_rol = 3 WHERE id_usuario = $1", [
        id_usuario,
      ]);
    }

    // Crear el perfil de paciente
    const nuevoPaciente = await Paciente.create({
      id_usuario,
      id_doctor_principal,
      tipo_sangre,
      peso,
      altura,
      alergias,
      fecha_diagnostico_diabetes,
      tipo_diabetes,
      nivel_riesgo: nivel_riesgo || "Medio",
      observaciones,
    });

    res.status(201).json({
      message: "Perfil de paciente completado exitosamente",
      data: nuevoPaciente,
    });
  } catch (error) {
    console.error("Error en completarPerfilPaciente:", error);
    next(error);
  }
};

exports.getPacienteById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    res.status(200).json({ data: paciente });
  } catch (error) {
    next(error);
  }
};

exports.createPaciente = async (req, res, next) => {
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
      // Datos específicos del paciente
      id_doctor_principal,
      tipo_sangre,
      peso,
      altura,
      alergias,
      fecha_diagnostico_diabetes,
      tipo_diabetes,
      nivel_riesgo,
      observaciones,
    } = req.body;

    // Verificar si el email ya existe
    const existingUser = await Usuario.findByEmail(email);
    let userId;

    if (existingUser) {
      // Si el usuario ya existe, usamos su ID
      userId = existingUser.id_usuario;

      // Verificar si ya tiene perfil de paciente
      const existingPaciente = await db.query(
        "SELECT * FROM pacientes WHERE id_usuario = $1",
        [userId]
      );

      if (existingPaciente.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "Este usuario ya tiene un perfil de paciente" });
      }

      // Actualizamos el rol a paciente si es necesario
      if (existingUser.id_rol !== 3) {
        await db.query("UPDATE usuarios SET id_rol = 3 WHERE id_usuario = $1", [
          userId,
        ]);
      }
    } else {
      // Si no existe, creamos un nuevo usuario
      const nuevoUsuario = await Usuario.create({
        id_rol: 3, // Rol de paciente
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

    // Crear el perfil de paciente
    const nuevoPaciente = await Paciente.create({
      id_usuario: userId,
      id_doctor_principal,
      tipo_sangre,
      peso,
      altura,
      alergias,
      fecha_diagnostico_diabetes,
      tipo_diabetes,
      nivel_riesgo: nivel_riesgo || "Medio",
      observaciones,
    });

    // Obtener nombre para la respuesta
    const nombre_respuesta = existingUser ? existingUser.nombre : nombre;
    const apellido_respuesta = existingUser ? existingUser.apellido : apellido;
    const email_respuesta = existingUser ? existingUser.email : email;

    res.status(201).json({
      message: "Perfil de paciente creado exitosamente",
      data: {
        ...nuevoPaciente,
        nombre: nombre_respuesta,
        apellido: apellido_respuesta,
        email: email_respuesta,
      },
    });
  } catch (error) {
    console.error("Error en createPaciente:", error);
    next(error);
  }
};

exports.updatePaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    // Actualizar datos del paciente
    const updatedPaciente = await Paciente.update(id, {
      id_doctor_principal: req.body.id_doctor_principal,
      tipo_sangre: req.body.tipo_sangre,
      peso: req.body.peso,
      altura: req.body.altura,
      alergias: req.body.alergias,
      fecha_diagnostico_diabetes: req.body.fecha_diagnostico_diabetes,
      tipo_diabetes: req.body.tipo_diabetes,
      nivel_riesgo: req.body.nivel_riesgo,
      observaciones: req.body.observaciones,
    });

    if (!updatedPaciente) {
      return res
        .status(500)
        .json({ message: "Error al actualizar el paciente" });
    }

    // Actualizar datos del usuario si se proporcionan
    if (
      req.body.nombre ||
      req.body.apellido ||
      req.body.telefono ||
      req.body.direccion
    ) {
      await Usuario.update(paciente.id_usuario, {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
      });
    }

    // Obtener paciente actualizado con datos del usuario
    const pacienteActualizado = await Paciente.findById(id);

    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      data: pacienteActualizado,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const deletedPaciente = await Paciente.delete(id);

    if (!deletedPaciente) {
      return res
        .status(500)
        .json({ message: "Error al desactivar el paciente" });
    }

    res.status(200).json({
      message: "Paciente desactivado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasPaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consultas = await Paciente.getConsultas(id);

    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.getCitasPaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const citas = await Paciente.getCitas(id);

    res.status(200).json({ data: citas });
  } catch (error) {
    next(error);
  }
};

exports.getEvaluacionesPiePaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const evaluaciones = await Paciente.getEvaluacionesPie(id);

    res.status(200).json({ data: evaluaciones });
  } catch (error) {
    next(error);
  }
};

exports.getResultadosLaboratorioPaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const resultados = await Paciente.getResultadosLaboratorio(id);

    res.status(200).json({ data: resultados });
  } catch (error) {
    next(error);
  }
};
