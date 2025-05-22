const db = require("../config/database");

const Consulta = require("../models/consultaModel");

exports.getAllConsultas = async (req, res, next) => {
  try {
    const consultas = await Consulta.findAll();
    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.getAllConsultas = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    let consultas = [];

    // Si es admin, obtiene todas las consultas
    if (req.userData.rol === 1) {
      consultas = await Consulta.findAll();
    }
    // Si es doctor, solo obtiene consultas de sus pacientes
    else if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultDoctor.rows.length > 0) {
        const id_doctor = resultDoctor.rows[0].id_doctor;
        consultas = await Consulta.getConsultasByDoctor(id_doctor);
      }
    }
    // Si es paciente, solo obtiene sus consultas
    else if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (resultPaciente.rows.length > 0) {
        const id_paciente = resultPaciente.rows[0].id_paciente;
        consultas = await Consulta.getConsultasByPaciente(id_paciente);
      } else {
        return res.status(404).json({
          message:
            "No se encontró un perfil de paciente asociado a este usuario",
        });
      }
    } else {
      return res.status(403).json({ message: "Rol de usuario no autorizado" });
    }

    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.createConsulta = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden crear consultas
    if (
      req.userData.rol !== 1 &&
      !(req.userData.rol === 2 && req.userData.doctor_verificado)
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para realizar esta acción" });
    }

    const {
      id_cita,
      id_videocita,
      id_paciente,
      id_doctor,
      fecha_consulta,
      tipo_consulta,
      sintomas,
      diagnostico,
      tratamiento,
      observaciones,
      recomendaciones,
      fecha_proxima_revision,
    } = req.body;

    // Validar que al menos un origen (cita o videocita) está presente
    if (!id_cita && !id_videocita) {
      return res
        .status(400)
        .json({ message: "Se requiere un id_cita o id_videocita" });
    }

    // Validar que el paciente y doctor existan
    if (!id_paciente || !id_doctor) {
      return res
        .status(400)
        .json({ message: "Se requiere id_paciente y id_doctor" });
    }

    // Si es doctor (no admin), verificar que sea el doctor asignado
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length === 0 ||
        resultDoctor.rows[0].id_doctor !== parseInt(id_doctor)
      ) {
        return res
          .status(403)
          .json({
            message: "Solo puedes crear consultas como el doctor asignado",
          });
      }
    }

    const nuevaConsulta = await Consulta.create({
      id_cita,
      id_videocita,
      id_paciente,
      id_doctor,
      fecha_consulta,
      tipo_consulta,
      sintomas,
      diagnostico,
      tratamiento,
      observaciones,
      recomendaciones,
      fecha_proxima_revision,
    });

    if (!nuevaConsulta) {
      return res.status(500).json({ message: "Error al crear la consulta" });
    }

    // Obtener la consulta con información completa
    const consultaCompleta = await Consulta.findById(nuevaConsulta.id_consulta);

    res.status(201).json({
      message: "Consulta creada exitosamente",
      data: consultaCompleta,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateConsulta = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;
    const consulta = await Consulta.findById(id);

    if (!consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    // Solo admin o el doctor que creó la consulta pueden actualizarla
    if (req.userData.rol !== 1) {
      if (req.userData.rol === 2) {
        const resultDoctor = await db.query(
          "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
          [req.userData.id]
        );

        if (
          resultDoctor.rows.length === 0 ||
          resultDoctor.rows[0].id_doctor !== consulta.id_doctor
        ) {
          return res
            .status(403)
            .json({ message: "Solo puedes actualizar tus propias consultas" });
        }
      } else {
        return res
          .status(403)
          .json({ message: "No tienes permisos para actualizar consultas" });
      }
    }

    const updatedConsulta = await Consulta.update(id, {
      sintomas: req.body.sintomas,
      diagnostico: req.body.diagnostico,
      tratamiento: req.body.tratamiento,
      observaciones: req.body.observaciones,
      recomendaciones: req.body.recomendaciones,
      fecha_proxima_revision: req.body.fecha_proxima_revision,
    });

    if (!updatedConsulta) {
      return res
        .status(500)
        .json({ message: "Error al actualizar la consulta" });
    }

    // Obtener la consulta actualizada con información completa
    const consultaActualizada = await Consulta.findById(id);

    res.status(200).json({
      message: "Consulta actualizada exitosamente",
      data: consultaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteConsulta = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consulta = await Consulta.findById(id);

    if (!consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    const deletedConsulta = await Consulta.delete(id);

    if (!deletedConsulta) {
      return res.status(500).json({ message: "Error al eliminar la consulta" });
    }

    res.status(200).json({
      message: "Consulta eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
exports.getConsultaById = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id = req.params.id;
    const consulta = await Consulta.findById(id);

    if (!consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    // Si es admin, permitir acceso
    if (req.userData.rol === 1) {
      return res.status(200).json({ data: consulta });
    }

    // Si es doctor, verificar si la consulta es suya
    if (req.userData.rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor FROM doctores WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultDoctor.rows.length > 0 &&
        resultDoctor.rows[0].id_doctor === consulta.id_doctor
      ) {
        return res.status(200).json({ data: consulta });
      }
    }

    // Si es paciente, verificar si la consulta es suya
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === consulta.id_paciente
      ) {
        return res.status(200).json({ data: consulta });
      }
    }

    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a esta consulta" });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasByPaciente = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    const id_paciente = parseInt(req.params.id_paciente);

    // Si es admin, puede ver consultas de cualquier paciente
    if (req.userData.rol === 1) {
      const consultas = await Consulta.getConsultasByPaciente(id_paciente);
      return res.status(200).json({ data: consultas });
    }

    // Si es doctor, verificar si el paciente está asignado a él
    if (req.userData.rol === 2) {
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

        if (resultPaciente.rows.length > 0) {
          const consultas = await Consulta.getConsultasByPaciente(id_paciente);
          return res.status(200).json({ data: consultas });
        }
      }
    }

    // Si es el propio paciente
    if (req.userData.rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [req.userData.id]
      );

      if (
        resultPaciente.rows.length > 0 &&
        resultPaciente.rows[0].id_paciente === id_paciente
      ) {
        const consultas = await Consulta.getConsultasByPaciente(id_paciente);
        return res.status(200).json({ data: consultas });
      }
    }

    return res
      .status(403)
      .json({ message: "No tienes permisos para acceder a estas consultas" });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasByDoctor = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;
    const consultas = await Consulta.getConsultasByDoctor(id_doctor);

    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};
