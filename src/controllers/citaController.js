const Cita = require("../models/citaModel");

exports.getAllCitas = async (req, res, next) => {
  try {
    const citas = await Cita.findAll();
    res.status(200).json({ data: citas });
  } catch (error) {
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

    res.status(200).json({ data: cita });
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
      return res
        .status(400)
        .json({
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
        return res
          .status(400)
          .json({
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
    const id_paciente = req.params.id_paciente;
    const citas = await Cita.getCitasByPaciente(id_paciente);
    res.status(200).json({ data: citas });
  } catch (error) {
    next(error);
  }
};
