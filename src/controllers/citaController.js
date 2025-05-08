const Cita = require("../models/citaModel");
const db = require("../config/database");

exports.getAllCitas = async (req, res, next) => {
  try {
    // Verificar que userData existe
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    let citas = [];

    // Si es admin, obtiene todas las citas
    if (req.userData.rol === 1) {
      citas = await Cita.findAll();
    }
    // Si es doctor, solo obtiene sus citas
    else if (req.userData.rol === 2) {
      // Intentar usar id_doctor del token
      if (req.userData.id_doctor) {
        citas = await Cita.getCitasByDoctor(req.userData.id_doctor);
      } else {
        // Si no está en el token, buscarlo en la base de datos
        const resultDoctor = await db.query(
          "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
          [req.userData.id]
        );

        if (resultDoctor.rows.length > 0) {
          const id_doctor = resultDoctor.rows[0].id_doctor;
          citas = await Cita.getCitasByDoctor(id_doctor);
        }
      }
    }
    // Si es paciente, solo obtiene sus citas
    else if (req.userData.rol === 3) {
      // Intentar usar id_paciente del token
      if (req.userData.id_paciente) {
        citas = await Cita.getCitasByPaciente(req.userData.id_paciente);
      } else {
        // Si no está en el token, buscarlo en la base de datos
        const resultPaciente = await db.query(
          "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
          [req.userData.id]
        );

        if (resultPaciente.rows.length > 0) {
          const id_paciente = resultPaciente.rows[0].id_paciente;
          citas = await Cita.getCitasByPaciente(id_paciente);
        } else {
          return res.status(404).json({
            message:
              "No se encontró un perfil de paciente asociado a este usuario",
          });
        }
      }
    } else {
      return res.status(403).json({ message: "Rol de usuario no autorizado" });
    }

    res.status(200).json({ data: citas });
  } catch (error) {
    console.error("Error en getAllCitas:", error);
    next(error);
  }
};
exports.getCitaById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    // Si es admin, permitir acceso
    if (req.userData.rol === 1) {
      return res.status(200).json({ data: cita });
    }

    // Si es doctor, verificar si la cita es suya
    if (req.userData.rol === 2) {
      // Obtener id_doctor del usuario
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length > 0 &&
        resultDoctor.rows[0].id_doctor === cita.id_doctor
      ) {
        return res.status(200).json({ data: cita });
      }
    }

    // Si es paciente, verificar si la cita es suya
    if (req.userData.rol === 3) {
      // Obtener id_paciente del usuario
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === cita.id_paciente
      ) {
        return res.status(200).json({ data: cita });
      }
    }

    // Si no tiene permisos
    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a esta cita" });
  } catch (error) {
    next(error);
  }
};

exports.createCita = async (req, res, next) => {
  try {
    const {
      id_paciente,
      id_doctor,
      id_centro,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      tipo_cita,
      motivo,
      notas_previas,
    } = req.body;

    // Verificar disponibilidad del doctor
    const disponible = await Cita.verificarDisponibilidad(
      id_doctor,
      fecha,
      hora_inicio,
      hora_fin
    );

    if (!disponible) {
      return res.status(400).json({
        message: "El doctor no está disponible en el horario seleccionado",
      });
    }

    const nuevaCita = await Cita.create({
      id_paciente,
      id_doctor,
      id_centro,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      tipo_cita,
      motivo,
      notas_previas,
    });

    if (!nuevaCita) {
      return res.status(500).json({ message: "Error al crear la cita" });
    }

    // Obtener la cita con información completa
    const citaCompleta = await Cita.findById(nuevaCita.id_cita);

    res.status(201).json({
      message: "Cita creada exitosamente",
      data: citaCompleta,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCita = async (req, res, next) => {
  try {
    const id = req.params.id;
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    const {
      id_paciente,
      id_doctor,
      id_centro,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      tipo_cita,
      motivo,
      notas_previas,
    } = req.body;

    // Verificar disponibilidad del doctor (solo si cambia horario o doctor)
    if (
      id_doctor !== cita.id_doctor ||
      fecha !== cita.fecha ||
      hora_inicio !== cita.hora_inicio ||
      hora_fin !== cita.hora_fin
    ) {
      // continuación de src/controllers/citaController.js
      const disponible = await Cita.verificarDisponibilidad(
        id_doctor || cita.id_doctor,
        fecha || cita.fecha,
        hora_inicio || cita.hora_inicio,
        hora_fin || cita.hora_fin,
        id // Pasar id para excluir la cita actual
      );

      if (!disponible) {
        return res.status(400).json({
          message: "El doctor no está disponible en el horario seleccionado",
        });
      }
    }

    const updatedCita = await Cita.update(id, {
      id_paciente: id_paciente || cita.id_paciente,
      id_doctor: id_doctor || cita.id_doctor,
      id_centro: id_centro || cita.id_centro,
      fecha: fecha || cita.fecha,
      hora_inicio: hora_inicio || cita.hora_inicio,
      hora_fin: hora_fin || cita.hora_fin,
      estado: estado || cita.estado,
      tipo_cita: tipo_cita || cita.tipo_cita,
      motivo: motivo || cita.motivo,
      notas_previas: notas_previas || cita.notas_previas,
    });

    if (!updatedCita) {
      return res.status(500).json({ message: "Error al actualizar la cita" });
    }

    // Obtener la cita actualizada con información completa
    const citaActualizada = await Cita.findById(id);

    res.status(200).json({
      message: "Cita actualizada exitosamente",
      data: citaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCita = async (req, res, next) => {
  try {
    const id = req.params.id;
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    const deletedCita = await Cita.delete(id);

    if (!deletedCita) {
      return res.status(500).json({ message: "Error al cancelar la cita" });
    }

    res.status(200).json({
      message: "Cita cancelada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getProximasCitas = async (req, res, next) => {
  try {
    const citas = await Cita.getProximasCitas();
    res.status(200).json({ data: citas });
  } catch (error) {
    next(error);
  }
};

exports.getCitasByDoctor = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;
    const citas = await Cita.getCitasByDoctor(id_doctor);
    res.status(200).json({ data: citas });
  } catch (error) {
    next(error);
  }
};

exports.getCitasByPaciente = async (req, res, next) => {
  try {
    const id_paciente = parseInt(req.params.id_paciente);

    // Verificar permisos
    // Si es admin, puede ver citas de cualquier paciente
    if (req.userData.rol === 1) {
      const citas = await Cita.getCitasByPaciente(id_paciente);
      return res.status(200).json({ data: citas });
    }

    // Si es doctor, verificar si el paciente está asignado a él
    if (req.userData.rol === 2) {
      // Obtener id_doctor del usuario
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const id_doctor = resultDoctor.rows[0].id_doctor;

        // Verificar si el paciente está asignado a este doctor
        const resultPaciente = await db.query(
          "SELECT * FROM pacientes WHERE id_paciente = $1 AND id_doctor_principal = $2",
          [id_paciente, id_doctor]
        );

        // También verificar en tabla doctor_paciente si existe
        const resultDoctorPaciente = await db
          .query(
            "SELECT * FROM doctor_paciente WHERE id_doctor = $1 AND id_paciente = $2",
            [id_doctor, id_paciente]
          )
          .catch(() => ({ rows: [] })); // Si la tabla no existe, tratar como vacía

        if (
          resultPaciente.rows.length > 0 ||
          resultDoctorPaciente.rows.length > 0
        ) {
          const citas = await Cita.getCitasByPaciente(id_paciente);
          return res.status(200).json({ data: citas });
        }
      }
    }

    // Si es el propio paciente
    if (req.userData.rol === 3) {
      // Obtener id_paciente del usuario
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === id_paciente
      ) {
        const citas = await Cita.getCitasByPaciente(id_paciente);
        return res.status(200).json({ data: citas });
      }
    }

    // Si no tiene permisos
    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a estas citas" });
  } catch (error) {
    next(error);
  }
};
