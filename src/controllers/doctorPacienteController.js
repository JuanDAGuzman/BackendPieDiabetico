const DoctorPaciente = require("../models/doctorPacienteModel");
const Doctor = require("../models/doctorModel");
const Paciente = require("../models/pacienteModel");

exports.asignarPaciente = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;
    const { id_paciente } = req.body;

    if (!id_paciente) {
      return res.status(400).json({ message: "Se requiere id_paciente" });
    }

    // Verificar que el doctor exista y esté verificado
    const doctor = await Doctor.findById(id_doctor);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }
    if (doctor.estado_verificacion !== "Aprobado") {
      return res.status(400).json({ message: "El doctor no está verificado" });
    }

    // Verificar que el paciente exista
    const paciente = await Paciente.findById(id_paciente);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const asignacion = await DoctorPaciente.asignarPaciente(
      id_doctor,
      id_paciente
    );

    res.status(201).json({
      message: "Paciente asignado exitosamente",
      data: asignacion,
    });
  } catch (error) {
    next(error);
  }
};

exports.desasignarPaciente = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;
    const id_paciente = req.params.id_paciente;

    const desasignacion = await DoctorPaciente.desasignarPaciente(
      id_doctor,
      id_paciente
    );

    if (!desasignacion) {
      return res.status(404).json({ message: "Relación no encontrada" });
    }

    res.status(200).json({
      message: "Paciente desasignado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getPacientesByDoctor = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;

    // Verificar que el doctor exista
    const doctor = await Doctor.findById(id_doctor);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const pacientes = await DoctorPaciente.getPacientesByDoctor(id_doctor);

    res.status(200).json({ data: pacientes });
  } catch (error) {
    next(error);
  }
};

// src/controllers/doctorPacienteController.js
const db = require("../config/database");

exports.getDoctoresByPaciente = async (req, res, next) => {
  try {
    const id_paciente = req.params.id_paciente;

    // Verificar si existe la tabla doctor_paciente
    // (si no existe, puedes devolver un array vacío o un mensaje apropiado)
    try {
      const doctores = await db.query(
        `
        SELECT d.*, u.nombre, u.apellido, u.email, u.telefono
        FROM doctores d
        JOIN doctor_paciente dp ON d.id_doctor = dp.id_doctor
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        WHERE dp.id_paciente = $1
        ORDER BY u.apellido, u.nombre
      `,
        [id_paciente]
      );

      res.status(200).json({ data: doctores.rows });
    } catch (error) {
      // Si la tabla no existe o hay otro error, devolver un array vacío
      console.error("Error al obtener doctores del paciente:", error);
      res.status(200).json({ data: [] });
    }
  } catch (error) {
    next(error);
  }
};
